# Behavioral assertions as operational artifacts

*From scenarios to assertions in distributed and AI-assisted systems*

## APIs already have strong structural tooling

Modern API systems already have strong tooling around structure and implementation. We can generate OpenAPI descriptions, validate schemas, monitor uptime, create SDKs, and scaffold large portions of an application from prompts or examples. Much of the routine work around API construction has become increasingly automated.

At the same time, distributed systems continue to fail in ways that are not primarily structural. JSON may validate correctly while workflows drift, assumptions diverge, affordances disappear, or state transitions become inconsistent across services and clients. In practice, many operational problems emerge from disagreements about behavior rather than disagreements about syntax.

Behavioral expectations are often scattered across several places:

* prose documentation
* automated test suites
* monitoring dashboards
* client-side assumptions
* tribal knowledge within teams

The result is fragmentation. The system may expose a formally valid interface while the operational meaning of the system becomes harder to inspect directly.

## From narrative scenarios to structured assertions

TRAM (Test Runner for Assertion Manifests) explores a different approach. Instead of treating behavioral expectations as details embedded inside code or narrative scenarios, TRAM treats assertions themselves as portable operational artifacts.

This idea sits within a familiar lineage. Behavior-Driven Development (BDD) helped shift attention away from implementation details and toward observable system behavior. A typical BDD scenario might read:

```text
Given a task exists
When the status is updated
Then the task becomes completed
```

The value of this style was clarity. Teams could discuss expected behavior in a shared language that connected domain intent to executable verification.

TRAM moves in a slightly different direction. The focus shifts from narrative scenarios toward structured assertions:

```json
{
  "path": "$.status",
  "equals": "completed"
}
```

The important distinction is not the use of JSON instead of prose. The larger shift is that assertions become directly inspectable as independent operational statements. They can be reused, grouped, queried, analyzed, or executed without being tightly coupled to a particular test script or implementation framework.

In this model, the manifest becomes a place where operational expectations are expressed explicitly. Assertions may describe:

* valid state transitions
* expected response structures
* affordance presence
* collection invariants
* validation rules
* error semantics
* behavioral constraints

TRAM now organizes behavioral verification into six progressive layers:

```text
Level 0 — Surface
Level 1 — Shape
Level 2 — Safe behavior
Level 3 — Unsafe behavior
Level 4 — Workflow
Level 5 — Governance
```

Each layer isolates a different class of operational concern while narrowing debugging scope and preserving readable behavioral intent.

This changes the role of verification. Instead of merely asking whether a test passes, the system begins to expose the operational assumptions that govern expected behavior.

## Optional properties and behavioral contracts

The distinction between structural validation and behavioral validation becomes more visible as APIs evolve over time.

Traditional schema-oriented validation often assumes that stable representations should expose stable fields. In practice, distributed systems frequently operate with conditional representations:

* permissions may affect field visibility
* affordances may appear only in certain states
* sparse responses may omit metadata
* evolving systems may gradually introduce new properties
* runtime conditions may alter representation shape

In these environments, absence can itself be valid behavior.

Recent additions to the TRAM assertion model support optional property assertions.

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
if present, it must still validate as a string
```

The important point is not the syntax itself. The larger implication is that behavioral correctness is no longer treated as identical to rigid structural completeness.

A missing property may still represent correct operational behavior. A present property with invalid semantics does not.

The distinction between representation shape and semantic legitimacy becomes increasingly important in evolving systems.

A representation may remain structurally recognizable while violating operational expectations around:

* allowed values
* ranges
* permissions
* workflow constraints
* behavioral policies

This becomes especially important in hypermedia-oriented systems where affordances, metadata, and navigation controls may appear conditionally at runtime. Optional assertions allow manifests to model these conditional representations without collapsing into either rigid schema enforcement or loosely defined payload checking.

The result is a middle ground between exhaustive schema systems and purely ad hoc testing. Assertions remain executable and explicit while still allowing representations to evolve behaviorally over time.

## Hypermedia broadens the definition of testing

The distinction becomes more visible in hypermedia-oriented systems. Many API testing approaches assume a relatively static environment:

* known endpoints
* predefined workflows
* fixed sequences of operations

Hypermedia systems operate differently. Clients discover available actions dynamically through links, forms, and embedded controls. In these systems, behavior is exposed at runtime through affordances rather than being fully predetermined in client code.

In hypermedia-oriented systems, runtime discoverability itself becomes part of observable behavior.

Testing therefore expands beyond endpoint correctness into questions of navigability, affordance exposure, and runtime coordination surfaces.

Verification now includes questions such as:

* Are expected affordances present?
* Can clients discover valid transitions?
* Are navigation surfaces exposed consistently?
* Do runtime constraints appear correctly?

The attached TRAM manifest already reflects this orientation. One assertion verifies the presence of a `_links` object at the API root along with a discoverable `taskList` affordance. Another verifies that task collections expose valid state values across all returned items.

Recent additions to the assertion model also support object-map traversal (`eachProperty`), allowing manifests to validate affordance-oriented structures such as hypermedia link maps without introducing scripting or custom matcher code.

For example:

```json
{
  "path": "$._links",
  "eachProperty": {
    "hasProperties": ["href", "method"]
  }
}
```

TRAM distinguishes between:

* `each` for arrays
* `eachProperty` for object maps

It also distinguishes between:

* `path` for structural traversal
* `property` for scalar leaf assertions

This allows manifests to express nested affordance validation while preserving declarative readability.

Optional assertions also work inside nested object-map traversal.

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

This allows manifests to express behavioral expectations around conditional affordance metadata while preserving declarative structure and readable operational intent.

These checks move beyond endpoint availability. They verify aspects of runtime coordination and discoverability that are especially important in adaptive or agent-oriented systems.

## Generated systems increase the value of behavioral clarity

This becomes increasingly relevant as generated code becomes more common. AI-assisted development can accelerate implementation work substantially. At the same time, implementation itself becomes a less stable coordination surface. Different generated components may satisfy structural requirements while still drifting behaviorally over time.

As implementation becomes easier to generate, operational behavior becomes more important as a durable point of reference.

Assertion manifests offer one possible stabilizing layer. They provide a shared behavioral reference point that can be inspected by:

* developers
* architects
* CI systems
* monitoring tools
* AI assistants

Recent workflow-oriented manifest patterns also allow TRAM assertions to model accumulated operational narratives rather than isolated endpoint checks.

A workflow manifest may:

* create resources
* retrieve intermediate state
* apply mutations
* verify accumulated final state

This allows operational continuity itself to become directly inspectable.

This is not primarily about replacing human judgment with automation. The manifest creates a visible representation of expected operational behavior that humans and machines can collaborate around. Assertions become reviewable objects rather than hidden details buried inside application code or testing frameworks.

That collaborative aspect matters. Many software artifacts are optimized either for machines or for humans, but not both simultaneously. Assertion manifests occupy an interesting middle space. They remain executable while still exposing operational intent in a relatively direct form.

## Behavior as a first-class operational layer

The broader architectural question underneath TRAM is whether behavior itself should become a first-class operational layer in distributed systems. APIs already expose structural contracts through schemas and interface descriptions. Hypermedia systems expose runtime affordances through messages. Assertion manifests extend this progression by exposing behavioral expectations as portable, inspectable artifacts independent of implementation details.

TRAM also supports stable run-scoped interpolation values, allowing related behavioral interactions to share state across requests without introducing custom scripting. This keeps multi-step workflows explicit, reviewable, and manifest-driven.

The layered structure also narrows debugging scope operationally.

If a workflow assertion fails at Level 4 while Levels 0–3 continue passing, the failure can often be localized to continuity, accumulation, or sequencing behavior rather than transport, representation, or isolated mutation semantics.

This approach does not replace existing testing or observability systems. Unit tests, schema validation, monitoring, and contract testing each address important concerns. TRAM explores a narrower but increasingly important space: the explicit expression of operational behavior itself.

The implementation underneath a system may evolve rapidly over time. Behavioral expectations still need to remain visible, reviewable, and stable enough for coordination to persist across teams, services, tooling, and increasingly adaptive runtime environments.
