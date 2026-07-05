class ICommand {
  async execute() {
    throw new Error('ICommand.execute() tiene que ser implementado');
  }
}

module.exports = ICommand;
