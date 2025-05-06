import * as fs from "fs";
import * as dotenv from "dotenv";
import { z } from "zod";
import { Project, SourceFile } from "ts-morph";

type Props = {
  envFilePath?: string;
  dtsFilePath?: string;
};

// Parse the .d.ts file and extract the ProcessEnv interface
const parseEnvTypes = (filePath: string) => {
  const project = new Project();
  const sourceFile: SourceFile = project.addSourceFileAtPath(filePath);

  // Extract all enums in the file
  const enums = sourceFile
    .getEnums()
    .reduce<Record<string, any>>((acc, enumNode) => {
      const name = enumNode.getName();
      const values = enumNode.getMembers().map((member) => member.getValue());
      acc[name] = values;
      return acc;
    }, {} as Record<string, string[]>);

  // Find the ProcessEnv interface
  const processEnvInterface = sourceFile.getInterfaceOrThrow("ProcessEnv");

  // Extract properties and their types
  const properties = processEnvInterface.getProperties().map((property) => {
    const name = property.getName();
    const type = property.getTypeNode()?.getText() || "string";

    const trailingComment =
      property.getTrailingCommentRanges()[0]?.getText() || "";

    const regexMatches = [...trailingComment.matchAll(/@regex\s+([^@]+)/g)].map(
      (match) => match[1].trim()
    );

    return { name, type, regexes: regexMatches };
  });

  return { properties, enums };
};
// Dynamically generate the zod schema based on the parsed types
const generateSchema = (
  properties: { name: string; type: string; regexes: string[] }[],
  enums: Record<string, string[]>
) => {
  const schemaShape = properties.reduce((acc, { name, type, regexes }) => {
    // Check if the type is an enum
    if (enums[type]) {
      acc[name] = z.enum(enums[type] as [string, ...string[]]);
    } else {
      acc[name] = z.string();
    }
    // Add regex validation for multiple patterns
    if (regexes.length > 0) {
      acc[name] = acc[name].refine(
        (value) => regexes.some((regex) => new RegExp(regex).test(value)),
        {
          message: `${name} does not match any of the required patterns: ${regexes.join(
            ", "
          )}`,
        }
      );
    }

    return acc;
  }, {} as Record<string, z.ZodTypeAny>);

  return z.object(schemaShape);
};

/**
 * validates `.env` file from env.d.ts file.
 * @param props.envFilePath - Path to the `.env` file. Defaults to './.env'.
 * @param props.dtsFilePath - Path to the `.d.ts` file. Defaults to './env.d.ts'.
 */
export const validateEnv = (props: Props = {}) => {
  const { envFilePath = "./.env", dtsFilePath = "./env.d.ts" } = props;

  dotenv.config(envFilePath ? { path: envFilePath } : {});
  const { properties, enums } = parseEnvTypes(dtsFilePath || "./env.d.ts");
  const envSchema = generateSchema(properties, enums);

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Environment variable validation failed:");
    result.error.issues.forEach((issue) => {
      console.error(`- ${issue.path[0]}: ${issue.message}`);
    });
    process.exit(1); // Exit with an error code
  }

  console.log("Environment variables validated successfully.");
};

/**
 * Generates TypeScript types from a `.env` file.
 * @param props.envFilePath - Path to the `.env` file. Defaults to './.env'.
 * @param props.dtsFilePath - Path to the `.d.ts` file. Defaults to './env.d.ts'.
 */
export const generateTypes = (props: Props = {}) => {
  const { envFilePath = "./.env", dtsFilePath = "./env.d.ts" } = props;

  const dotenvConfig = dotenv.config(envFilePath ? { path: envFilePath } : {});
  const envVariables = dotenvConfig.parsed || {};
  const envVars = Object.keys(envVariables).reduce<Record<string, any>>(
    (acc, key) => {
      acc[key] = typeof envVariables[key];
      return acc;
    },
    {}
  );

  const typeDefinitions = `interface ProcessEnv {
${Object.entries(envVars)
  .map(([key, type]) => `    ${key}: ${type};`)
  .join("\n")}
}
`;

  fs.writeFileSync(dtsFilePath || "./env.d.ts", typeDefinitions);
  console.log("Type definitions generated successfully.");
};
