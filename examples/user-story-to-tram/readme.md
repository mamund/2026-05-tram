# From User Story to Executable Evidence

Testing an API usually becomes straightforward once you know what you want to test. The harder question is deciding which behaviors matter in the first place.

One useful place to start is the user story. A user story describes a behavioral expectation, but it rarely describes everything that must be true for that expectation to be satisfied. We can uncover those additional behaviors by asking three questions: What behavior is **explicit** in the story? What other behaviors are **required** for it to work? And what behaviors are reasonably **implied** by it?

From there, we can decide which behaviors are important, identify the observations that would provide convincing evidence for them, and express those observations as executable TRAM assertions.

The following walkthrough uses a simple Task Manager API to follow that path from beginning to end:

**User Story → Explicit / Required / Implied → Behavioral Claims → Evidence → TRAM Manifest → Results**


## 1. Start with the user story

We can cast the existing task-management behavior as a conventional user story:

> As a task manager, I want to mark a task completed so that I can distinguish completed work from active work.

At this point, we know nothing about TRAM assertions. We just ask:

> **What behaviors are explicit, required, or implied by this story?**

## 2. Extract the behaviors

| Kind         | Behavior                                            | Why                                                                          |
| ------------ | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Explicit** | A task can be marked completed.                     | This is the action stated by the story.                                      |
| **Required** | The target task exists.                             | We cannot update a nonexistent task.                                         |
| **Required** | The completed state is observable after the change. | Otherwise we cannot validate that the story succeeded.                       |
| **Implied**  | The task begins in a non-completed state.           | Otherwise marking it completed proves very little.                           |
| **Implied**  | Unsupported status changes should be rejected.      | A bounded status vocabulary suggests invalid changes should not be accepted. |

That gives us **candidate behaviors**, not automatically five tests.

The next question is: which of these provide useful evidence for the central claim?

For a first manifest, I would select four:

1. the task initially exists;
2. it initially has a non-completed state;
3. its status can be changed to `completed`;
4. retrieving it afterward shows `completed`.

I would leave invalid status handling for a separate negative-behavior test. That keeps this manifest focused on one claim.

## 3. Turn the behaviors into evidence

Now we can ask what observations would substantiate each behavior.

| Behavioral claim      | Evidence                                        |
| --------------------- | ----------------------------------------------- |
| Task exists           | `GET` returns `200`                             |
| Task begins active    | returned `status` is `active`                   |
| Status can be changed | `PUT` returns `200` and `status` is `completed` |
| Change persists       | later `GET` returns `status` as `completed`     |

Notice how the TRAM layers now appear naturally.

The first GET gives us **Surface + Shape + Safe** evidence.

The PUT gives us **Unsafe/state-changing** evidence.

The final GET gives us **Workflow** evidence because we're verifying the consequence of the earlier interaction.

So we didn't start by saying, "I need a Workflow test." We started with the behavior and discovered that Workflow evidence was useful.

## 4. Express that evidence as TRAM

Using the task ID already present in the sample Task Management API, a behavior-centered manifest could look roughly like this:

```json
{
  "name": "Complete Task Behavior",
  "manifestVersion": "0.2",
  "version": "1.0.0",

  "config": {
    "baseUrl": "http://localhost:3000",
    "defaultHeaders": {
      "accept": "application/json"
    }
  },

  "data": {
    "task": {
      "id": "c3e59224-93d5-4b07-9317-6dc24eb586b3",
      "completed": {
        "task": {
          "id": "c3e59224-93d5-4b07-9317-6dc24eb586b3",
          "status": "completed"
        }
      }
    }
  },

  "tests": [
    {
      "id": "complete-task-initial-state",
      "name": "Task initially exists and is active",
      "method": "GET",
      "path": "/tasks/${data.task.id}",
      "expect": {
        "status": 200,
        "body": [
          {
            "path": "$.id",
            "equals": "${data.task.id}"
          },
          {
            "path": "$.status",
            "equals": "active"
          }
        ]
      }
    },

    {
      "id": "complete-task-change-status",
      "name": "Mark task completed",
      "method": "PUT",
      "path": "/tasks/${data.task.id}/status",
      "headers": {
        "content-type": "application/json"
      },
      "bodyType": "json",
      "body": "$data.task.completed",
      "expect": {
        "status": 200,
        "body": [
          {
            "path": "$.id",
            "equals": "${data.task.id}"
          },
          {
            "path": "$.status",
            "equals": "completed"
          }
        ]
      }
    },

    {
      "id": "complete-task-resulting-state",
      "name": "Completed state persists",
      "method": "GET",
      "path": "/tasks/${data.task.id}",
      "expect": {
        "status": 200,
        "body": [
          {
            "path": "$.status",
            "equals": "completed"
          }
        ]
      }
    }
  ]
}
```

This is already much more meaningful than simply writing:

```json
{
  "method": "PUT",
  "path": "/tasks/.../status",
  "expect": {
    "status": 200
  }
}
```

The latter proves that the request returned successfully. The behavior-centered version provides evidence for the actual story.

## 5. Run it

Assuming the sample API is running on port 3000 and the manifest is named `complete-task.json`:

```bash
tram complete-task.json
```

Conceptually, the execution should read something like:

```text
Complete Task Behavior

✓ Task initially exists and is active
  ✓ Status is 200
  ✓ $.id equals expected task id
  ✓ $.status equals "active"

✓ Mark task completed
  ✓ Status is 200
  ✓ $.id equals expected task id
  ✓ $.status equals "completed"

✓ Completed state persists
  ✓ Status is 200
  ✓ $.status equals "completed"

PASS
```

And now we have an evidence package for one behavioral claim.

