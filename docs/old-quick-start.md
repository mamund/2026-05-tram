# TRAM Quick Start

This guide walks through running the TRAM sample project and inspecting the behavioral testing workflow.

The goal is not only to execute the sample tests, but to understand the relationship between:

* the sample API
* the manifest
* the assertions
* the runner
* the resulting behavioral model

TRAM treats API testing as behavioral modeling rather than framework scripting.

---

# Understand the behavioral layers

TRAM organizes behavioral testing into six progressive layers.

| Level | Focus | Question |
|---|---|---|
| 0 | Surface | Can the API be reached? |
| 1 | Shape | Do resources and affordances appear correctly? |
| 2 | Safe behavior | Do navigation, lookup, filtering, and query interactions behave correctly? |
| 3 | Unsafe behavior | Do isolated state-changing actions behave correctly? |
| 4 | Workflow | Can meaningful operational narratives be completed successfully? |
| 5 | Governance | Are policies, constraints, and semantic rules enforced correctly? |

The layers are additive.

Each layer narrows debugging scope while preserving readable behavioral intent.

---

# Requirements

TRAM currently requires:

```text
Node.js 18+
```

No external libraries or framework dependencies are required.

---

# Clone the repository

```bash
git clone https://github.com/mamund/2026-05-tram.git
cd 2026-05-tram
```

---

# CLI setup

macOS/Linux:

```bash
chmod +x bin/tram
npm link
```

Windows:

```bash
npm link
```

Before executing a test suite, validate the manifest structure:

```bash
tram api-tests.json --validate
```

TRAM verifies the manifest and exits without making HTTP requests.

Then run the suite:

```bash
tram api-tests.json
```

---

# Understand the sample workflow

The sample project follows a simple execution model:

```text
sample API
        ↓
TRAM manifest
        ↓
manifest validation
        ↓
TRAM runner
        ↓
assertion results
```

The important artifact is the manifest:

```text
api-tests.json
```

The manifest contains:

* requests
* request bodies
* assertions
* expected behavior
* shared test data
* runtime interpolation values

The runner executes the manifest directly.

---

# Start the sample API

In one terminal window:

```bash
node sample-api/index.js
```

Expected output:

```text
Listening on port 3000
```

The sample API should now be running locally.

---

# Run the sample test suite

In another terminal window:

```bash
tram api-tests.json
```

Expected output:

```text
Task Management API Tests

✓ Get API root
✓ List tasks
✓ Get single task
✓ Reject unknown task lookup
✓ Create task
✓ Reject task creation without title
✓ Reject invalid task status
✓ Update task status
✓ Filter tasks by active status

Summary: 9 passed, 0 failed, 0 skipped, 9 total
```

At this point, TRAM has:

* loaded the manifest
* validated manifest structure
* initialized shared runtime data
* executed each request
* evaluated assertions
* generated behavioral results

Before executing HTTP requests, TRAM validates:

* manifest structure
* required fields
* supported HTTP methods
* supported body types
* duplicate test IDs

Invalid manifests fail before execution begins.

The sample manifest includes tests spanning several behavioral layers, from endpoint availability through workflow-oriented validation.

---


# Inspect the manifest

Open:

```text
api-tests.json
```

A typical test looks like this:

```json
{
  "name": "Create task",
  "method": "POST",
  "path": "/tasks",
  "body": "$data.task.valid",
  "expect": {
    "status": 201,
    "body": [
      {
        "path": "$.status",
        "equals": "active"
      }
    ]
  }
}
```

This test defines:

* an HTTP request
* request data
* expected response behavior

The important distinction is that assertions are directly inspectable.

Example:

```json
{
  "path": "$.status",
  "equals": "active"
}
```

This assertion is an explicit operational expectation.

---

# Understand path and reference syntax

TRAM currently uses several related traversal/reference systems.

## Assertion traversal

Assertion paths operate on response bodies.

Example:

```json
{
  "path": "$.status",
  "equals": "active"
}
```

## Manifest data lookup

Manifest data references retrieve reusable manifest-defined data.

Example:

```json
"body": "$data.task.valid"
```

## Runtime interpolation

Runtime interpolation inserts values into runtime request construction.

Example:

```json
"path": "/tasks/${data.stableId}"
```

---

# Understand runtime interpolation semantics

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

---

# Shared data and runtime interpolation

The `data` section stores reusable manifest-defined values.

Example:

```json
"data": {
  "stableId": "${randomId}",
  "filters": {
    "status": "active"
  }
}
```

The value:

```json
"${randomId}"
```

is resolved once when the manifest loads.

Later requests can reuse the stable value throughout the test run.

Example:

```json
"path": "/tasks/${data.stableId}"
```

Nested traversal is also supported.

Example:

```json
"query": {
  "status": "${data.filters.status}"
}
```

Interpolation is also supported inside assertions.

Example:

```json
{
  "path": "$.id",
  "equals": "${data.stableId}"
}
```

This enables coordinated multi-step behavioral flows without introducing custom scripting.

---

# Understand traversal semantics

TRAM distinguishes between:

* `path` for structural traversal
* `property` for scalar leaf checks

Example structural traversal:

```json
{
  "path": "$",
  "each": {
    "path": "$._links",
    "eachProperty": {
      "hasProperties": ["href", "method"]
    }
  }
}
```

Example scalar leaf assertion:

```json
{
  "path": "$",
  "each": {
    "property": "status",
    "equals": "active"
  }
}
```

TRAM also distinguishes between:

* `each` for arrays
* `eachProperty` for object maps

Example array traversal:

```json
{
  "path": "$",
  "each": {
    "property": "status",
    "equals": "active"
  }
}
```

Example object-map traversal:

```json
{
  "path": "$._links",
  "eachProperty": {
    "hasProperties": ["href", "method"]
  }
}
```

---

# Inspect the assertion model

Open:

```text
lib/assertions.js
```

Current assertion support includes:

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

TRAM supports native type assertions.

Supported values:

```text
string
number
boolean
array
object
null
```

Example native type assertion:

```json
{
  "path": "$.priority",
  "type": "number"
}
```

Example collection assertion:

```json
{
  "path": "$",
  "each": {
    "property": "status",
    "oneOf": ["active", "pending", "completed"]
  }
}
```

This assertion verifies:

```text
all returned tasks expose valid status values
```

---

# Understand governance assertions

Governance assertions verify:

* required fields
* allowed values
* semantic legitimacy
* ranges
* policy constraints

Example governance assertion:

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

Example range governance assertion:

```json
{
  "path": "$.priority",
  "range": {
    "min": 1,
    "max": 5
  }
}
```

TRAM also supports optional property assertions.

Example:

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

Optional assertions are useful for:

* sparse representations
* evolving APIs
* hypermedia metadata
* permission-dependent fields
* state-dependent representations

---

# Understand nested traversal

TRAM supports nested collection and object-map traversal.

Example:

```json
{
  "path": "$",
  "each": {
    "path": "$._links",
    "eachProperty": {
      "hasProperties": ["href", "method"]
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

Type assertions also work inside nested object-map traversal.

Example:

```json
{
  "path": "$._links",
  "eachProperty": {
    "path": "$.href",
    "type": "string"
  }
}
```

The assertion model supports:

* collection traversal
* nested traversal
* object-map iteration
* native value validation
* optional property validation
* hypermedia affordance validation

while remaining declarative and inspectable.

TRAM intentionally limits type assertions to native value categories.

The following are currently out of scope:

```text
uuid
email
uri
date-time
schema validation
```

---

# Understand workflow-oriented behavioral modeling

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

Workflow manifests allow behavioral continuity and accumulated-state verification to remain directly inspectable.

---

# Inspect request body handling

TRAM currently supports:

```text
json
form
text
```

Example:

```json
{
  "method": "PUT",
  "path": "/tasks/task-1/status",
  "bodyType": "form",
  "body": "$data.task.updateStatus"
}
```

This allows the runner to work with APIs that expect different request encodings.

---

# Run in verbose mode

Verbose mode prints detailed assertion results.

```bash
tram api-tests.json --verbose
```

Verbose mode helps reveal:

* assertion evaluation
* JSON path traversal
* collection assertions
* object-map assertions
* native type assertions
* optional property behavior
* failure messages
* behavioral expectations

---

# Generate a machine-readable report

```bash
tram api-tests.json --report results.json
```

This generates a detailed JSON report containing:

* request details
* response details
* assertion results
* pass/fail summaries

Only successfully validated manifests generate execution reports.

---

# Try intentionally breaking a test

One of the fastest ways to understand TRAM is to intentionally introduce a failure.

## Change an expected value

Change:

```json
"equals": "active"
```

to:

```json
"equals": "closed"
```

Then rerun the suite.

## Disable a test

Add:

```json
"enabled": false
```

to a test.

Then rerun the suite.

## Break a request body

Remove a required property from a POST request body.

Then rerun the suite.

## Break a range assertion

Change:

```json
"range": {
  "min": 1,
  "max": 5
}
```

to:

```json
"range": {
  "min": 100
}
```

Then rerun the suite.

## Break a type assertion

Change:

```json
"type": "number"
```

to:

```json
"type": "string"
```

Then rerun the suite.

## Break an optional property assertion

Change:

```json
{
  "property": "description",
  "optional": true,
  "type": "string"
}
```

so the API returns:

```json
"description": 42
```

Then rerun the suite.

The assertion should fail because optional properties are still validated when present.

## Break a runtime reference

Change:

```json
"${data.stableId}"
```

to:

```json
"${data.noSuchValue}"
```

Then rerun the suite.

## Break an object-map assertion

Change:

```json
"hasProperties": ["href", "method"]
```

to:

```json
"hasProperties": ["href", "verb"]
```

Then rerun the suite.

These experiments help reveal:

* behavioral expectations
* assertion failures
* request construction
* manifest ergonomics
* runtime interpolation behavior
* nested traversal behavior
* native type validation
* optional property validation
* failure readability

---

# Understand the current philosophy

TRAM currently emphasizes:

* behavioral API testing
* explicit manifests
* readable assertions
* low-noise reporting
* predictable execution
* framework independence
* augmentation over automation

The current design intentionally avoids:

```text
custom scripting
schema engines
scripted setup/teardown orchestration
hidden runtime behavior
```

---

# AI Coaching direction

The long-term direction includes an AI Coaching layer.

The AI Coach is intended to:

* inspect `server.js` and/or API Story documents
* identify API behaviors
* suggest candidate tests
* distinguish happy and sad paths
* review assertions collaboratively
* generate executable manifests
* support layered behavioral modeling
* help users understand workflow and governance testing

The goal is not one-shot generation alone.

The goal is helping users understand behavioral API testing while collaboratively constructing executable manifests.

---

# Recommended next steps

Recommended files to inspect:

```text
README.md
api-tests.json
lib/assertions.js
bin/tram
```

Recommended next experiments:

* add new sad-path tests
* add new range assertions
* add new type assertions
* add optional property assertions
* add filtering tests
* add workflow manifests
* add governance manifests
* add collection assertions
* add object-map assertions
* improve reporting
* explore manifest ergonomics
* experiment with hypermedia assertions
* experiment with stable run-scoped variables
