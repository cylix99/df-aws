export const DELETE_METAFIELD = `
  mutation metafieldsDelete($input: MetafieldsDeleteInput!) {
    metafieldsDelete(input: $input) {
      deletedIds
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export const CANCEL = `
    mutation bulkOperationCancel($id: ID!) {
      bulkOperationCancel(id: $id) {
        bulkOperation {
          id
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

export const TAGS_ADD = `
    mutation addTags($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) {
        node {
          id
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

export const TAGS_REMOVE = `
    mutation tagsRemove($id: ID!, $tags: [String!]!) {
      tagsRemove(id: $id, tags: $tags) {
        node {
          id
        }
        userErrors {
          field
          message
          
        }
      }
    }
  `;
