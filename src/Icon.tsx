import grid from './assets/grid.svg'
import scan from './assets/scan.svg'
import flash from './assets/flash.svg'
import check from './assets/check.svg'
import scanCheck from './assets/scan-check.svg'
import search from './assets/search.svg'
import down from './assets/down.svg'
import next from './assets/next.svg'

const assets = { grid, scan, flash, check, scanCheck, search, down, next }
const characters = { plus: '+', back: '‹', info: 'ⓘ', edit: '♢' }

export type IconName = keyof typeof assets | keyof typeof characters

export function Icon({ name }: { name: IconName }) {
  if (name in assets) {
    return <img className={'icon icon--' + name} src={assets[name as keyof typeof assets]} alt="" />
  }

  return <span className={'icon icon--' + name} aria-hidden="true">{characters[name as keyof typeof characters]}</span>
}
