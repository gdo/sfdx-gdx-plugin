import { flags, SfdxCommand } from "@salesforce/command";
import { Messages, SfdxError, SfdxProject } from "@salesforce/core";
import { AnyJson } from "@salesforce/ts-types";
import { pascalCase } from "change-case";
import * as fs from "fs";
import * as ejs from "ejs";

// https://medium.com/@pongsatt/how-to-build-your-own-project-templates-using-node-cli-c976d3109129

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages("sfdx-gdx-plugin", "apex-class-create");

async function packageGet(name: string): Promise<any> {
  const project = await SfdxProject.resolve();
  const projectJson = await project.resolveProjectConfig();

  for (let i = 0; i < projectJson.packageDirectories.length; i += 1) { // eslint-disable-line 
    const packageDescription = projectJson.packageDirectories[i];
    if (packageDescription.package === name) {
      return packageDescription;
    }
  }
  return undefined;
}

async function sourceApiVersionGet(): Promise<any> {
  const project = await SfdxProject.resolve();
  const projectJson = await project.resolveProjectConfig();
  return projectJson.sourceApiVersion;
}

async function render(template: string, pathDest: string, data: object): Promise<string> {
  const content = await ejs.renderFile(
    `${__dirname}/../../../../../template/${template}.ejs`,
  data
  );
  fs.writeFileSync(pathDest, content);
  return pathDest
}

function isPascalCase(name: string): Boolean {
  return name === pascalCase(name);
}

function controlFileExist(path: string) {
  if (fs.existsSync(path)) {
    throw new SfdxError(messages.getMessage("errorFileAlreadyExist", [path]));
  }
}

export default class Init extends SfdxCommand {
  public static description = messages.getMessage("commandDescription");

  public static examples = [
    `$ sfdx gdx:apex:class:create -p packageName -n className
    Creation d'une class Apex et de sa classe de test dans le bon package
    `
  ];

  protected static flagsConfig = {
    packagename: flags.string({
      char: "p",
      required: true,
      description: messages.getMessage("packageName")
    }),
    name: flags.string({
      char: "n",
      required: true,
      description: messages.getMessage("className")
    })
  };
  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    const className = this.flags.name;

    const sourceApiVersion = await sourceApiVersionGet();

    const packageDescription = await packageGet(this.flags.packagename);
    if (packageDescription === undefined) {
      throw new SfdxError(
        messages.getMessage("errorNoPackage", [this.flags.packagename])
      );
    }

    // TODO faire en sorte que la notation LC_ProjectPanelData soit possible
    // TODO interdire le pattern test en fin de fichier
    if (!isPascalCase(this.flags.name)) {
      throw new SfdxError(
        messages.getMessage("errorNoPascalCase", [this.flags.name])
      );
    }

    // TODO comment trouver la racine du projet ???
    if (!fs.existsSync(packageDescription.path)) {
      throw new SfdxError(
        messages.getMessage("errorNoDir", [packageDescription.path])
      );
    }
    const pathDest = `${packageDescription.path}/classes`;
    if (!fs.existsSync(pathDest)) {
      throw new SfdxError("TODO create classes directory");
    }

    const filenameDest = `${pathDest}/${className}.cls`;
    controlFileExist(filenameDest);
    const filenameTestDest = `${pathDest}/${className}_TEST.cls`;
    controlFileExist(filenameTestDest);

    // TODO AUTHOR
    let date: Date = new Date();  

    const created = []
    created.push(await render("class", filenameDest, { className, today: `${date.getDay()+1}/${date.getMonth()+1}/${date.getFullYear()}` }));
    created.push(await render("class_meta", `${filenameDest}-meta.xml`, { sourceApiVersion }));
    created.push(await render("class_TEST", filenameTestDest, { className: `${className}_TEST` }));
    created.push(await render("class_meta", `${filenameTestDest}-meta.xml`, { sourceApiVersion }));

    created.forEach(filename => {
      this.ux.log('File created', filename);
    })

    // Return an object to be displayed with --json
    return { created };
  }
}
