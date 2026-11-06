import { OperatorFunction, map } from 'rxjs';

export interface GraphqlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

/** Unwraps a GraphQL HTTP response, throwing when it carries errors or no data. */
export function unwrapGraphql<T>(): OperatorFunction<GraphqlResponse<T>, T> {
  return map((response) => {
    if (response.errors?.length || !response.data) {
      throw new Error(response.errors?.[0]?.message ?? 'Empty GraphQL response');
    }
    return response.data;
  });
}