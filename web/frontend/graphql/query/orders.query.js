export const CHECK_BULK = `
  query {
    currentBulkOperation {
      id
      status
      url
      objectCount
      errorCode
    }
  }
`;
