export type ProjectEntity = {
  id: string;
  name: string;
  description: string;
  owner: string;
  collaborators: string[];
  state: string;
  versions: string[];
};
