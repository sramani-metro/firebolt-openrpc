/*
 * Copyright 2021 Comcast Cable Communications Management, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

const enumReducer = (acc, val, i, arr) => {
    const keyName = val.split(':').pop().replace(/[\.\-]/g, '_').replace(/\+/g, '_plus').replace(/([a-z])([A-Z0-9])/g, '$1_$2').toUpperCase()
    acc = acc + `    ${keyName}: '${val}'`
    if (i < arr.length-1) {
      acc = acc.concat(',\n')
    }
    return acc
  }
  
const generateEnum = schema => {
  if (!schema.enum) {
    return ''
  }
  else {
    let str = '{\n'
    str += schema.enum.reduce(enumReducer, '')
    str += '\n}\n'
    return str
  }
}

function getMethodSignature(method) {
  let javascript = (isInterface ? '' : 'function ') + method.name + '('
  javascript += getMethodSignatureParams(method)
  javascript += ')'
  
  return javascript
}

function getMethodSignatureParams(method) {
  return method.params.map( param => param.name ).join(', ')
}

export {
  generateEnum,
  getMethodSignature,
  getMethodSignatureParams
}