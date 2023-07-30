export default class {

  constructor(name) {
    this.name = name;
  }

  log(...args) {
    return console.log(this.name, '==>', ...args);
  }

  error(...args) {
    return console.error(this.name, '==>', ...args);
  }

  warn(...args) {
    return console.warn(this.name, '==>', ...args);
  }

  dev(...args) {
    if (process.env.NODE_ENV === 'production') return;
    return console.log('DEV! ', this.name, '==>', ...args);
  }
  
}