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

import { getHeaderText, getIncludeGuardOpen, getStyleGuardOpen, getIncludeDefinitions, getStyleGuardClose,
         getIncludeGuardClose, getSchemaShape, getSchemaType, getPropertySetterSignature, getPropertyGetterSignature,
         getPropertyEventCallbackSignature, getPropertyEventSignature } from '../../../shared/nativehelpers.mjs'
import { getSchemas } from '../../../shared/modules.mjs'
import { getNameSpaceOpen,getNameSpaceClose, getJsonDefinition } from '../../../shared/cpphelpers.mjs'

import { fsWriteFile, logSuccess, fsMkDirP, logHeader, combineStreamObjects, schemaFetcher,clearDirectory, localModules, trimPath, fsReadFile } from '../../../shared/helpers.mjs'
import path from 'path'
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

  const shape = generateTypesForDefinitions(obj, schemas)
  if (shape.deps.size > 0 || shape.type.length > 0) {
    code.push(getHeaderText())
    code.push(getIncludeGuardOpen(obj, 'common'))
    const i = getIncludeDefinitions(obj)
    code.push(i.join('\n'))
    code.push(getStyleGuardOpen(obj))
    shape.type.forEach(type => shape.deps.add(type))
    code.push([...shape.deps].join('\n'))
    code.join('\n')
    code.push(getStyleGuardClose())
    code.push(getIncludeGuardClose())
    code.join('\n')
  }
  return code
}

const generateHeaderForModules = (obj = {}, schemas = {}) => {
  const code = []

  code.push(getHeaderText())
  code.push(getIncludeGuardOpen(obj))
  const i = getIncludeDefinitions(obj)
  code.push(i.join('\n'))
  code.push(getStyleGuardOpen(obj))
  const shape = generateTypesForModules(obj, schemas)
  const m = generateMethodPrototypes(obj, schemas)
  m.deps.forEach(dep => shape.deps.add(dep))
  shape.type.forEach(type => shape.deps.add(type))
  code.push([...shape.deps].join('\n'))
  code.join('\n')
  code.push(m.type && m.type.join('\n'))
  code.push(getStyleGuardClose())
  code.push(getIncludeGuardClose())
  code.join('\n')
  return code
}
const generateJsonDataHeaderForDefinitions = (obj = {}, schemas = {}) => {
  const code = []
  const shape = generateJsonTypesForDefinitons(obj, schemas)
  if (shape.deps.size > 0 || shape.type.length > 0) {
    code.push(getHeaderText())
    code.push('#pragma once' + '\n')
    const i = getIncludeDefinitions(obj)
    code.push(i.join('\n'))
    code.push(getNameSpaceOpen(obj))
    code.push([...shape.deps].join('\n'))
    code.join('\n')
    code.push(shape.type && shape.type.join('\n'))
    code.join('\n')
    code.push(getNameSpaceClose(obj))
  }
  return code
}

const generateCppForDefinitions = (obj = {}, schemas = {}) => {
  const code = []

  code.push(getHeaderText())
  const i = getIncludeDefinitions(obj, true)
  code.push(i.join('\n'))
  code.push(getStyleGuardOpen(obj))
  const shape = generateImplForDefinitions(obj, schemas)
  code.push([...shape.deps].join('\n'))
  code.join('\n')
  code.push(shape.type.join('\n'))
  code.push(getStyleGuardClose())
  code.join('\n')
  return code
}

//For each schema object, 
const generateImplForDefinitions = (json, schemas = {}) => compose(
  reduce((acc, val) => {
    const shape = getSchemaShape(json, val[1], schemas, val[0])
    acc.type.push(shape.type.join('\n'))
    shape.deps.forEach(dep => acc.deps.add(dep))
    return acc
  }, {type: [], deps: new Set()}),
  getDefinitions //Get schema under Definitions
)(json)


//For each schema object, 
const generateTypesForDefinitions = (json, schemas = {}) => compose(
  reduce((acc, val) => {
    const shape = getSchemaShape(json, val[1], schemas, val[0])
    acc.type.push(shape.type.join('\n'))
    shape.deps.forEach(dep => acc.deps.add(dep))
    return acc
  }, {type: [], deps: new Set()}),
  getDefinitions //Get schema under Definitions
)(json)

const generateTypesForModules = (json,  schemas = {}) => compose(
  reduce((acc, val) => {
    const shape = getSchemaShape(json, val[1], schemas, val[0])
    acc.type.push(shape.type.join('\n'))
    shape.deps.forEach(dep => acc.deps.add(dep))
    return acc
  }, {type: [], deps: new Set()}),
  getSchemas //Get schema under Definitions
)(json)

const generateJsonTypesForDefinitons = (json, schemas = {}) => compose(
  reduce((acc, val) => {
    const shape = getJsonDefinition(json, val[1], schemas, val[0])
    acc.type.push(shape.type.join('\n'))
    shape.deps.forEach(dep => acc.deps.add(dep))
    return acc
  }, {type: [], deps: new Set()}),
  getDefinitions //Get schema under Definitions
)(json)


const generateMethodPrototypes = (json, schemas = {}) => {
  
  let sig = {type: [], deps: new Set()}

  const properties = json.methods.filter( m => m.tags && m.tags.find(t => t.name.includes('property'))) || []
  
  properties.forEach(property => {
 //   console.log(`Method - ${JSON.stringify(property,null,4)}`)
    const event = m => m.tags.find(t => t.name === 'property:readonly' || t.name === 'property')
    const setter = m => m.tags.find(t => t.name === 'property')
    
    let res = getSchemaType(json, property.result.schema, property.result.name || property.name, schemas,{descriptions: true, level: 0})
 //   console.log(`Type - ${res.type}`)
 //   console.log(`Deps - `)
 //   res.deps.forEach((dep, index) => console.log(`Item# - ${dep}`))
    res.deps.forEach(dep => sig.deps.add(dep))

    sig.type.push(getPropertyGetterSignature(property, json, res.type) + ';\n')

    if(event(property)) {
      sig.type.push(getPropertyEventCallbackSignature(property, json, res.type) + ';\n')
      sig.type.push(getPropertyEventSignature(property, json, res.type) + ';\n')
    }
    else if(setter(property)) {
      sig.type.push(getPropertySetterSignature(property, json, res.type) + ';\n')
    }
  })

  return sig
}


export {
  generateHeaderForDefinitions,
  generateHeaderForModules,
  generateJsonDataHeaderForDefinitions
}