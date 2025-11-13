let _mockReturnValue = Promise.resolve([]);
let _mockError = null;

export async function getCollection() {
  if (_mockError) {
    throw _mockError;
  }
  return _mockReturnValue;
}

export function setMockReturnValue(value) {
  _mockReturnValue = Promise.resolve(value);
}

export function setMockError(error) {
  _mockError = error;
}

export function clearMock() {
  _mockReturnValue = Promise.resolve([]);
  _mockError = null;
}
