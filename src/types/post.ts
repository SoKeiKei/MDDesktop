export interface PostAccount {
  uid: string
  type: string
  displayName: string
  checked: boolean
  icon?: string
  title?: string
  home?: string
  status?: 'uploading' | 'failed' | 'done'
  msg?: string
  error?: string
  editResp?: {
    draftLink: string
  }
}

export interface Post {
  title: string
  content: string
  path?: string
  lastModified?: number
  markdown?: string
  thumb?: string
  desc?: string
  accounts?: PostAccount[]
} 