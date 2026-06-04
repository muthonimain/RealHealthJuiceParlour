export interface EmployeePublic {
  id: string
  name: string
  username: string
}

export interface EmployeeManaged extends EmployeePublic {
  password: string
}
