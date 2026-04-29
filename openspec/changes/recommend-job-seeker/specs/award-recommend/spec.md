## ADDED Requirements

### Requirement: Recommend form collects job-seeker profile fields

The system MUST present a recommendation form that includes: education (single-choice selector), contact method (text or phone input consistent with UX), job intent, expected salary range, self-introduction, and additional notes.

#### Scenario: User views the award screen with all fields visible

- **WHEN** the user opens `pages/award/award`
- **THEN** the screen SHALL expose input controls for education, contact, job intent, expected salary range, self-introduction, and additional notes in addition to the job seeker's name field.

---

### Requirement: Default name and contact from logged-in user

The system MUST pre-fill the job seeker's name and contact fields with the current logged-in user's `username` and `userphone` from `_User` when that data has been loaded successfully.

#### Scenario: Logged-in user sees defaults

- **WHEN** `_User` query returns a record for the current session's user
- **THEN** the name field SHALL be initialized to that user's `username` and the contact field SHALL be initialized to that user's `userphone` unless the user has already edited those fields in the same session (implementation MAY reset on each load per product choice; default SHALL be pre-filled on first load).

---

### Requirement: Persist submission to MyRecommend

The system MUST persist the completed form to the Bmob `MyRecommend` table when the user confirms (e.g. taps the primary submit/confirm control), including `userName` and `userPhone` for the submitting user and all new seeker-related fields as defined in the change design.

#### Scenario: Successful submit

- **WHEN** the user taps the confirm control and validation passes
- **THEN** the client SHALL write a `MyRecommend` record (or update per design decision) with at least: submitter `userPhone`, submitter `userName`, seeker identity fields (`recoName`, `recoEducation`, `recoContact`, `recoJobIntent`, `recoSalaryRange`, `recoIntro`, `recoExtra` as implemented), compatible with duplicate-handling rules chosen in implementation.

---

### Requirement: Education is single-choice

The education field MUST NOT allow multiple simultaneous selections; selection SHALL be enforced via a single-select control (e.g. `picker` selector mode).

#### Scenario: User selects education

- **WHEN** the user picks one option from the education list
- **THEN** exactly one stored value SHALL represent education for that submission.
