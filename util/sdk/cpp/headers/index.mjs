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

/**
 * 1. Add License text
 * 2. Get Module name and generate include gaurd
 * 3. Add C++ Style guard open
 * 4. Generate Macros (if any)
 * 5. Generate types
 * 6. Generate function prototypes
 * 7. Add C++ Style guard close
 * 8. Add Include Guard Close 
 *
 */

import helpers from 'crocks/helpers/index.js'
const { compose, getPathOr } = helpers
import getPath from 'crocks/Maybe/getPath.js'
import pointfree from 'crocks/pointfree/index.js'
const { chain, filter, reduce, option, map } = pointfree
import logic from 'crocks/logic/index.js'
const { not } = logic
import safe from 'crocks/Maybe/safe.js'
import predicates from 'crocks/predicates/index.js'
const { isObject, isArray, propEq, pathSatisfies, hasProp, propSatisfies } = predicates

import { getHeaderText, getIncludeGuardOpen, getStyleGuardOpen, getStyleGuardClose, getIncludeGuardClose, getSchemaShape} from '../../../shared/nativehelpers.mjs'

// Maybe an array of <key, value> from the schema
const getDefinitions = compose(
  option([]),
  chain(safe(isArray)),
  map(Object.entries), // Maybe Array<Array<key, value>>
  chain(safe(isObject)), // Maybe Object
  getPath(['definitions']) // Maybe any
)

const generateHeaderForDefinitions = (obj = {}, schemas = {}) => {
  const code = []

  console.log(Object.keys(schemas))

  code.push(getHeaderText())
  code.push(getIncludeGuardOpen(obj))
  //code.push(getIncludeDefinitions(obj, schemas)) //Todo
  code.push(getStyleGuardOpen(obj))
  const shape = generateTypesForDefitions(obj, schemas)
  console.log(`Deps - ${JSON.stringify(shape.deps)}`)
  code.push([...shape.deps].join('\n'))
  code.join('\n')
  code.push(shape.type.join('\n'))
  code.push(getStyleGuardClose())
  code.push(getIncludeGuardClose())
  code.join('\n')
  return code
}

//For each schema object, 
const generateTypesForDefitions = (json, schemas = {}) => compose(
  reduce((acc, val) => {

    
    const shape = getSchemaShape(json, val[1], schemas, val[0])

    acc.type.push(shape.type.join('\n'))
    acc.deps = new Set([...acc.deps, ...shape.deps])

    return acc
  }, {type: [], deps: new Set()}),
  getDefinitions //Get schema under Definitions
)(json)


export {
  generateHeaderForDefinitions
}
