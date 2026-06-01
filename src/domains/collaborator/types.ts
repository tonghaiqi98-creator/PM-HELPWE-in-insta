export type CollaboratorRole =
  | 'creator'
  | 'designer'
  | 'developer'
  | 'tester'
  | 'watcher'

export type Collaborator = {
  id: string
  requirementId: string
  memberOpenId: string
  role: CollaboratorRole
  receiveNotification: boolean
}

export type AddCollaboratorInput = Omit<Collaborator, 'id'>
