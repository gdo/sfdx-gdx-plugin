import { flags, SfdxCommand } from "@salesforce/command";
import { Messages, SfdxError, SfdxProject } from "@salesforce/core";
import { AnyJson } from "@salesforce/ts-types";

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages("sfdx-gdx-plugin", "init");

export default class Init extends SfdxCommand {
  public static description = messages.getMessage("commandDescription");

  public static examples = [
    `$ sfdx gdx:init
  Initialise les fichiers utile au plugin
  `
  ];

  protected static flagsConfig = {};
  public static args = [{ name: "file" }];
  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    this.ux.log(`Coucou`);

    const project = await SfdxProject.resolve();
    const projectJson = await project.resolveProjectConfig();

    console.log(">>>", projectJson);

    // Return an object to be displayed with --json
    return {};
  }
}
