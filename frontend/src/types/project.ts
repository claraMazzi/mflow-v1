export type ProjectEntity = {
  id: string;
  title: string;
  description: string;
  owner: string;
  collaborators: ReducedUserEntity[];
  state: string;
  versions: string[];
};

export type ReducedUserEntity = { 
  id: string;
  email: string;
}