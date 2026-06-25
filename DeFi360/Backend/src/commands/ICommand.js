class ICommand {
  async execute() {
    throw new Error('ICommand.execute() debe ser implementado');
  }
}

module.exports = ICommand;
