export interface ListTagsApiResponse {
    items: Array<{
      id: string;
      label: string;
    }>;
    next_starting_after?: string;
}