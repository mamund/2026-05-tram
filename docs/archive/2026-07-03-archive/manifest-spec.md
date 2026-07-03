# TRAM Manifest Specification v0.2

## Purpose

The TRAM manifest defines executable behavioral API tests.

The manifest is intentionally:

* human-readable
* machine-executable
* framework-independent
* declarative
* coaching-friendly

The manifest acts as both:

* executable configuration
* behavioral operational artifact

TRAM manifests are designed to support layered behavioral modeling for HTTP APIs.

TRAM manifests are intended to remain readable, reviewable operational artifacts even as implementation code evolves.

---

# Behavioral layering

TRAM organizes behavioral testing into six progressive layers.

| Level | Focus | Question |
|---|---|---|
| 0 | Surface | Can the API be reached? |
| 1 | Shape | Do resources and affordances appear correctly? |
| 2 | Safe behavior | Do navigation, lookup, filtering, and query interactions behave correctly? |
| 3 | Unsafe behavior | Do isolated state-changing actions behave correctly? |
| 4 | Workflow | Can meaningful operational narratives be completed successfully? |
| 5 | Governance | Are policies, constraints, permissions, and semantic rules enforced correctly? |

The layers are additive.

Each layer answers a different behavioral question while narrowing debugging scope.

---

# Runner execution

TRAM manifests are typically executed using the `tram` CLI.

Example:

```bash
tram api-tests.json
```

Manifest validation

TRAM validates manifests before execution. Validation can also be invoked directly from the command line:

```bash
tram api-tests.json --validate
```

Validation checks manifest structure, required fields, supported request methods, request body types, duplicate test identifiers, and other structural constraints. Validation does not contact the target API.

Verbose mode:

```bash
tram api-tests.json --verbose
```

Machine-readable report generation:

```bash
tram api-tests.json --report results.json
```

Reports are generated only for successfully validated manifests.

Typical execution flow:

```text
manifest load
        ↓
manifest validation
        ↓
runtime execution
        ↓
assertion evaluation
```

---

# File format

TRAM manifests are JSON documents.

Typical filename:

```text
api-tests.json
```

Recommended layered filenames:

```text
tram-level-0-surface-manifest.json
tram-level-1-shape-manifest.json
tram-level-2-behavior-safe-manifest.json
tram-level-3-behavior-unsafe-manifest.json
tram-level-4-workflow-manifest.json
tram-level-5-governance-manifest.json
```

---

# Top-level structure

```json
{
  "manifestVersion": "0.2",
  "version": "1.0.0",
  "name": "Task Management API Tests",
  "description": "Defines a set of behavioral tests for a task-management API.",
  "author": "Mike Amundsen",
  "config": {
    "baseUrl": "http://localhost:3000"
  },
  "data": {},
  "tests": []
}
```

---

# Top-level properties

| Property | Required | Description |
|---|---|---|
| `manifestVersion` | Yes | Version of the TRAM manifest specification |
| `version` | No | Version of this manifest/test collection |
| `name` | Yes | Human-readable test collection name |
| `description` | No | Description of the collection |
| `author` | No | Manifest author |
| `config` | Yes | Runner configuration |
| `data` | No | Shared request/test data |
| `tests` | Yes | Array of test definitions |

---

# Manifest validation

TRAM validates manifests before executing HTTP requests.

Validation currently includes:

* manifest JSON structure
* required top-level properties
* required test properties
* supported HTTP methods
* supported `bodyType` values
* duplicate test IDs

Invalid manifests fail before execution begins.

TRAM distinguishes between:

* manifest authoring failures
* request/runtime failures
* behavioral assertion failures

---

# Config structure

Example:

```json
"config": {
  "baseUrl": "http://localhost:3000",
  "timeoutMs": 5000,
  "defaultHeaders": {
    "accept": "application/json"
  }
}
```

## Config properties

| Property | Required | Description |
|---|---|---|
| `baseUrl` | Yes | Base URL for all requests |
| `timeoutMs` | No | Request timeout in milliseconds |
| `defaultHeaders` | No | Headers added to all requests |

---

# Test structure

Example:

```json
{
  "name": "Create task",
  "description": "Create a valid task.",
  "enabled": true,
  "tags": ["create", "happy-path"],
  "method": "POST",
  "path": "/tasks",
  "headers": {
    "content-type": "application/json"
  },
  "bodyType": "json",
  "body": "$data.task.valid",
  "expect": {
    "status": 201,
    "headers": [
      {
        "name": "content-type",
        "contains": "application/json"
      }
    ],
    "body": [
      {
        "path": "$.status",
        "equals": "active"
      }
    ]
  }
}
```

---

# Test properties

| Property | Required | Description |
|---|---|---|
| `id` | No | Stable unique identifier for the test |
| `name` | Yes | Human-readable test name |
| `description` | No | Additional test explanation |
| `enabled` | No | Enable/disable test execution. Default: `true` |
| `tags` | No | Array of classification tags |
| `method` | Yes | HTTP method |
| `path` | Yes | Request path |
| `headers` | No | Request headers |
| `query` | No | Query parameter object |
| `bodyType` | No | Request body encoding |
| `body` | No | Request body or `$data` reference |
| `expect` | Yes | Expected response assertions |

If present, test `id` values must be unique within a manifest.

Tests execute sequentially in manifest order.

---

# Supported HTTP methods

```text
GET
POST
PUT
PATCH
DELETE
HEAD
OPTIONS
```

---

# bodyType

Supported values:

```text
json
form
text
```

Default:

```text
json
```

## JSON example

```json
"bodyType": "json"
```

Sends:

```http
content-type: application/json
```

## Form example

```json
"bodyType": "form"
```

Sends:

```http
content-type: application/x-www-form-urlencoded
```

The body is encoded using:

```text
URLSearchParams
```

## Text example

```json
"bodyType": "text"
```

---

# Shared data

The `data` section stores reusable request/test data.

Example:

```json
"data": {
  "task": {
    "valid": {
      "task": {
        "id": "${randomId}",
        "title": "Buy milk",
        "status": "active",
        "priority": 3,
        "assignedUser": "alice"
      }
    }
  }
}
```

Referenced using:

```json
"body": "$data.task.valid"
```

---

# Runtime interpolation semantics

TRAM distinguishes between:

* object injection
* string interpolation

Use:

```json
"$data.someObject"
```

when injecting structured runtime objects.

Use:

```json
"${data.someValue}"
```

when interpolating values inside strings.

Correct object injection:

```json
"body": "$data.createTask"
```

Correct string interpolation:

```json
"path": "/tasks/${data.knownTaskId}"
```

Unresolved interpolation references fail manifest execution.

---

# Stable run-scoped variables

TRAM supports stable run-scoped values initialized once per test run.

Example:

```json
"data": {
  "stableId": "${randomId}"
}
```

Then referenced later:

```json
"path": "/tasks/${data.stableId}"
```

The value remains stable throughout the current test run.

A new value is generated on the next execution.

---

# Runtime tokens

Current runtime token support:

```text
${randomId}
${timestamp}
${uuid}
${randomEmail}
```

Example:

```json
{
  "id": "${randomId}"
}
```

## Runtime token behavior

### Direct usage

Tokens used directly inside requests are generated per encounter.

Example:

```json
{
  "id": "${randomId}"
}
```

Each occurrence generates a new value.

### Run-scoped initialization

Tokens inside `data` initialize once per test run.

Example:

```json
"data": {
  "stableId": "${randomId}"
}
```

All later references to:

```json
"${data.stableId}"
```

reuse the same generated value.

---

# Expectations

Structure:

```json
"expect": {
  "status": 200,
  "headers": [],
  "body": []
}
```

---

# status

Simple HTTP status assertion.

Example:

```json
"status": 200
```

---

# headers

Array of header assertions.

Header assertions use `name`.

Example:

```json
"headers": [
  {
    "name": "content-type",
    "contains": "application/json"
  }
]
```

Do not use `path` for header assertions.

---

# body

Array of response body assertions.

Body assertions operate on parsed JSON responses using JSONPath-like traversal.

Example:

```json
"body": [
  {
    "path": "$.status",
    "equals": "active"
  }
]
```

---

# Supported assertions

```text
exists
equals
contains
oneOf
type
range
isArray
hasProperties
minLength
each
eachProperty
```

---

# Traversal semantics

TRAM distinguishes between arrays and object maps.

Use:

* `each` for arrays
* `eachProperty` for object maps

Examples:

```json
[
  {...},
  {...}
]
```

```text
=> each
```

```json
{
  "self": {...},
  "edit": {...}
}
```

```text
=> eachProperty
```

TRAM also distinguishes between:

* `path` for structural traversal
* `property` for scalar leaf checks

Use `path` when:
- continuing traversal
- applying nested assertions
- re-entering the assertion engine

Use `property` when:
- checking direct scalar child values

---

# Assertion modifiers

## optional

Marks a property-oriented assertion as optional.

If the property is absent:

```text
the assertion passes
```

If the property exists:

```text
the assertion must still validate successfully
```

Default:

```json
"optional": false
```

Examples:

```json
{
  "path": "$",
  "each": {
    "property": "description",
    "optional": true,
    "type": "string"
  }
}
```

This assertion means:

```text
"description" may be absent
if present, it must be a string
```

Optional assertions also work inside nested `eachProperty` assertions.

Example:

```json
{
  "path": "$._links",
  "eachProperty": {
    "path": "$.title",
    "optional": true,
    "type": "string"
  }
}
```

## Optional assertion scope

Optional assertions apply only to:

```text
property-oriented assertions
```

Current supported usage includes:

```text
each.property.equals
each.property.contains
each.property.oneOf
each.property.type
each.property.range
nested eachProperty path assertions
```

Optional assertions do not apply to:

```text
status
exists
isArray
each
eachProperty
hasProperties
```

---

# Assertion reference

## exists

Checks that a path exists.

Example:

```json
{
  "path": "$.id",
  "exists": true
}
```

---

## equals

Checks exact equality.

Example:

```json
{
  "path": "$.status",
  "equals": "active"
}
```

---

## contains

Checks substring or array membership.

Example:

```json
{
  "path": "$.title",
  "contains": "milk"
}
```

---

## oneOf

Checks that a value matches one of several allowed values.

Example:

```json
{
  "path": "$.status",
  "oneOf": ["active", "pending", "completed"]
}
```

---

## type

Checks that a value matches a native JSON/JavaScript type.

Example:

```json
{
  "path": "$.id",
  "type": "string"
}
```

Supported values:

```text
string
number
boolean
array
object
null
```

Rules:

```text
type checks native value categories only
semantic formats are intentionally excluded
```

Out of scope:

```text
uuid
email
uri
date-time
regex formats
schema validation
```

---

## range

Checks that a numeric value falls within a valid range.

Example:

```json
{
  "path": "$.priority",
  "range": {
    "min": 1,
    "max": 5
  }
}
```

Rules:

```text
min optional
max optional
inclusive bounds
numeric values only
negative values supported
```

---

## isArray

Checks that the selected value is an array.

Example:

```json
{
  "path": "$",
  "isArray": true
}
```

---

## hasProperties

Checks that an object contains required properties.

Example:

```json
{
  "path": "$",
  "hasProperties": [
    "id",
    "title",
    "status"
  ]
}
```

---

## minLength

Checks minimum array/string length.

Example:

```json
{
  "path": "$",
  "minLength": 1
}
```

---

## each

Iterates over all elements of an array and applies assertions to each item.

Example:

```json
{
  "path": "$",
  "each": {
    "hasProperties": [
      "id",
      "title",
      "status"
    ]
  }
}
```

Rules:

```text
each only operates on arrays
non-array values fail the assertion
```

### each.property

Applies assertions to a property on each array item.

Example:

```json
{
  "path": "$",
  "each": {
    "property": "status",
    "oneOf": [
      "active",
      "pending",
      "completed"
    ]
  }
}
```

### each.property.type

Applies type assertions to a property on each array item.

Example:

```json
{
  "path": "$",
  "each": {
    "property": "priority",
    "type": "number"
  }
}
```

### each.property.range

Applies range assertions to a property on each array item.

Example:

```json
{
  "path": "$",
  "each": {
    "property": "priority",
    "range": {
      "min": 1,
      "max": 5
    }
  }
}
```

---

## eachProperty

Iterates over all properties in an object map and applies assertions to each property value.

Example:

```json
{
  "path": "$._links",
  "eachProperty": {
    "hasProperties": [
      "href",
      "method"
    ]
  }
}
```

Rules:

```text
eachProperty only operates on object maps
arrays fail the assertion
primitive values fail the assertion
```

---

# Nested assertions

Nested assertions are supported.

Example nested traversal:

```json
{
  "path": "$",
  "each": {
    "path": "$._links",
    "eachProperty": {
      "hasProperties": [
        "href",
        "method"
      ]
    }
  }
}
```

This assertion verifies:

```text
for each record
  for each link relation
    ensure href and method exist
```

Additional example:

```json
{
  "path": "$._links",
  "eachProperty": {
    "path": "$.method",
    "oneOf": [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE"
    ]
  }
}
```

---

# Workflow-oriented behavioral modeling

TRAM manifests can model operational workflows rather than isolated endpoint checks.

TRAM models workflows through declarative sequencing rather than embedded scripting.

A workflow manifest may:

* create resources
* retrieve intermediate state
* apply mutations
* verify accumulated final state

Example workflow sequence:

```text
create
read after create
edit
update status
assign user
set due date
read final accumulated state
```

Final-state verification example:

```json
{
  "path": "$.assignedUser",
  "equals": "${data.workflowAssigneeUpdate.task.assignedUser}"
}
```

Workflow manifests should read like operational narratives.

---

# Governance-oriented assertions

Governance assertions verify:

* required fields
* allowed values
* semantic legitimacy
* ranges
* error consistency
* policy constraints

Example allowed-value assertion:

```json
{
  "path": "$.status",
  "oneOf": [
    "pending",
    "active",
    "cancelled",
    "completed"
  ]
}
```

Example range assertion:

```json
{
  "path": "$.priority",
  "range": {
    "min": 1,
    "max": 5
  }
}
```

Example required-field failure assertion:

```json
{
  "path": "$.error",
  "contains": "title"
}
```

---

# Unsupported features

The current specification intentionally excludes:

```text
custom scripting
dedicated setup/teardown orchestration
parallel execution
schema engines
plugin systems
browser automation
```

---

# Design philosophy

The manifest design currently emphasizes:

```text
clarity
behavior visibility
predictability
reviewability
human understanding
low-noise execution
```
