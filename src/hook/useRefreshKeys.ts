import { getRandomString } from "../utils"

export type TUseKeys = [string, () => void]

const useKeys = () => {
  let key: string = getRandomString()
  const refreshKey = () => {
    key = getRandomString()
  }
  return [key, refreshKey] as TUseKeys
}

export default useKeys