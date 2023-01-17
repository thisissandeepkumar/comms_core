export class DuplicateEntryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateEntryError";

    Object.setPrototypeOf(this, DuplicateEntryError.prototype);
  }
}

export class InvalidDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDataError";

    Object.setPrototypeOf(this, InvalidDataError.prototype);
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";

    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";

    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class AccountDisabledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountDisabledError";

    Object.setPrototypeOf(this, AccountDisabledError.prototype);
  }
}
