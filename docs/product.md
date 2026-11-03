# <img src="assets/icons/product.svg" width="40" height="40" align="absmiddle" alt=""> Product

What Collab Board does: the two sides, journeys, statuses, rules and AI features.

## 1. Users

<p align="center"><img src="assets/diagrams/features.svg" width="100%" alt="Eight business features, eight platform guarantees and eight creator features"></p>

| | Businesses | Creators |
|---|---|---|
| Who | Cafés, shops, gyms and so on | People who post on Instagram, TikTok and similar |
| Shown as | A square in the business's colour | A round ring drawn from their tags |
| Account | One per business, named after it | One per person |
| Signs up with | Name, colour, username, password | Tags, formats, style, name, handle, one line, socials |
| Does | Posts collabs, reviews applicants, invites creators, marks posts complete | Browses, applies, visits, adds the post link |
| Tabs | Overview, My posts, Creators | Browse, Applications, Profile |

A **collab** offers something (a meal, a class, a product) in exchange for content. It has a title,
what's offered, what to post, a number of spots and an end date, plus optional details, who they're
looking for and a location.

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 2. Business journey

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontFamily': 'Archivo, Helvetica, Arial, sans-serif', 'primaryColor': '#fffdf8', 'primaryTextColor': '#241a16', 'primaryBorderColor': '#c8102e', 'secondaryColor': '#fbe3e4', 'tertiaryColor': '#faf5ea', 'lineColor': '#8a7b70', 'clusterBkg': '#faf5ea', 'clusterBorder': '#e6dccb', 'edgeLabelBackground': '#faf5ea', 'titleColor': '#241a16', 'actorBkg': '#fffdf8', 'actorBorder': '#c8102e', 'actorTextColor': '#241a16', 'signalColor': '#8a7b70', 'signalTextColor': '#8a7b70', 'labelBoxBkgColor': '#fbe9bf', 'noteBkgColor': '#fbe9bf', 'noteBorderColor': '#f2b632', 'pie1': '#2f6b3f', 'pie2': '#f2b632', 'pie3': '#c8102e', 'pieStrokeColor': '#fffdf8', 'pieOuterStrokeColor': '#e6dccb'}}}%%
flowchart TD
  S[Sign up: name and colour] --> O[Overview]
  O --> P[Post a collab]
  P -. optional .-> AI[Sparkle: one sentence fills the form]
  AI --> P
  P --> L[Live on the board]
  O --> C[Creators: search and AI summary]
  C --> I[Invite a creator to a post]
  L --> AP[Applicants]
  I --> AP
  AP --> D{Accept or decline}
  D -- accept --> V[Creator visits and shows the code]
  D -- decline --> X[Declined]
  V --> PL[Creator adds the post link]
  PL --> MC[Mark complete]
  classDef biz fill:#f2b632,stroke:#2a1b05,color:#2a1b05
  classDef cre fill:#e2efe2,stroke:#2f6b3f,color:#1f3317
  classDef plat fill:#fbe3e4,stroke:#c8102e,color:#241a16
  classDef data fill:#241a16,stroke:#241a16,color:#faf5ea
  classDef ext fill:#e3ecf4,stroke:#2f5f8a,color:#14324d
  classDef ok fill:#2f6b3f,stroke:#2f6b3f,color:#ffffff
  class S,O,P,C,I,D,MC biz
  class AI,L,AP plat
  class V,PL cre
  class X ext
```

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 3. Creator journey

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontFamily': 'Archivo, Helvetica, Arial, sans-serif', 'primaryColor': '#fffdf8', 'primaryTextColor': '#241a16', 'primaryBorderColor': '#c8102e', 'secondaryColor': '#fbe3e4', 'tertiaryColor': '#faf5ea', 'lineColor': '#8a7b70', 'clusterBkg': '#faf5ea', 'clusterBorder': '#e6dccb', 'edgeLabelBackground': '#faf5ea', 'titleColor': '#241a16', 'actorBkg': '#fffdf8', 'actorBorder': '#c8102e', 'actorTextColor': '#241a16', 'signalColor': '#8a7b70', 'signalTextColor': '#8a7b70', 'labelBoxBkgColor': '#fbe9bf', 'noteBkgColor': '#fbe9bf', 'noteBorderColor': '#f2b632', 'pie1': '#2f6b3f', 'pie2': '#f2b632', 'pie3': '#c8102e', 'pieStrokeColor': '#fffdf8', 'pieOuterStrokeColor': '#e6dccb'}}}%%
flowchart TD
  S[Sign up: tags, formats, socials] --> B[Browse the board]
  B --> X[Open a collab]
  X --> AP[Apply with one line]
  N[Invite from a business] --> AN{Accept the invite?}
  AP --> W[Applied]
  W --> AC[Accepted: code card]
  AN -- yes --> AC
  AC --> V[Visit and show the code]
  V --> PL[Add the post link: Posted]
  PL --> DN[Business marks complete]
  DN --> WL[Pinned to the profile wall]
  classDef biz fill:#f2b632,stroke:#2a1b05,color:#2a1b05
  classDef cre fill:#e2efe2,stroke:#2f6b3f,color:#1f3317
  classDef plat fill:#fbe3e4,stroke:#c8102e,color:#241a16
  classDef data fill:#241a16,stroke:#241a16,color:#faf5ea
  classDef ext fill:#e3ecf4,stroke:#2f5f8a,color:#14324d
  classDef ok fill:#2f6b3f,stroke:#2f6b3f,color:#ffffff
  class S,B,X,AP,V,PL cre
  class N,DN biz
  class AN,W,AC plat
  class WL ok
```

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 4. End-to-end flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontFamily': 'Archivo, Helvetica, Arial, sans-serif', 'primaryColor': '#fffdf8', 'primaryTextColor': '#241a16', 'primaryBorderColor': '#c8102e', 'secondaryColor': '#fbe3e4', 'tertiaryColor': '#faf5ea', 'lineColor': '#8a7b70', 'clusterBkg': '#faf5ea', 'clusterBorder': '#e6dccb', 'edgeLabelBackground': '#faf5ea', 'titleColor': '#241a16', 'actorBkg': '#fffdf8', 'actorBorder': '#c8102e', 'actorTextColor': '#241a16', 'signalColor': '#8a7b70', 'signalTextColor': '#8a7b70', 'labelBoxBkgColor': '#fbe9bf', 'noteBkgColor': '#fbe9bf', 'noteBorderColor': '#f2b632', 'pie1': '#2f6b3f', 'pie2': '#f2b632', 'pie3': '#c8102e', 'pieStrokeColor': '#fffdf8', 'pieOuterStrokeColor': '#e6dccb'}}}%%
sequenceDiagram
  actor B as Business
  participant App as Collab Board
  actor C as Creator
  B->>App: Post a collab with 2 spots
  C->>App: Apply with one line
  App-->>B: New applicant on Overview
  B->>App: Accept
  App-->>C: Accepted, with code CB-7K3Q
  C->>B: Visits and shows CB-7K3Q
  B-->>C: Checks it against Applicants
  C->>App: Adds the post link
  App-->>B: Posted
  B->>App: Mark complete
  App-->>C: Completed, pinned to the wall
```

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 5. Application statuses

<p align="center"><img src="assets/status-journey.svg" width="100%" alt="An application moves from Applied to Accepted to Posted to Completed"></p>

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontFamily': 'Archivo, Helvetica, Arial, sans-serif', 'primaryColor': '#fffdf8', 'primaryTextColor': '#241a16', 'primaryBorderColor': '#c8102e', 'secondaryColor': '#fbe3e4', 'tertiaryColor': '#faf5ea', 'lineColor': '#8a7b70', 'clusterBkg': '#faf5ea', 'clusterBorder': '#e6dccb', 'edgeLabelBackground': '#faf5ea', 'titleColor': '#241a16', 'actorBkg': '#fffdf8', 'actorBorder': '#c8102e', 'actorTextColor': '#241a16', 'signalColor': '#8a7b70', 'signalTextColor': '#8a7b70', 'labelBoxBkgColor': '#fbe9bf', 'noteBkgColor': '#fbe9bf', 'noteBorderColor': '#f2b632', 'pie1': '#2f6b3f', 'pie2': '#f2b632', 'pie3': '#c8102e', 'pieStrokeColor': '#fffdf8', 'pieOuterStrokeColor': '#e6dccb'}}}%%
stateDiagram-v2
  direction LR
  [*] --> Applied : creator applies
  [*] --> Invited : business invites
  Applied --> Accepted : business accepts
  Invited --> Accepted : creator accepts
  Applied --> Declined : business declines
  Invited --> Declined : creator declines
  Accepted --> Posted : creator adds link
  Posted --> Posted : creator fixes link
  Posted --> Completed : business marks complete
  Declined --> [*]
  Completed --> [*]
```

| Stamp | In the code | Means | Next step |
|---|---|---|---|
| Applied | `pending` | The creator applied | The business accepts or declines |
| Invited | `invited` | The business invited the creator | The creator accepts or declines |
| Accepted | `accepted` | A spot is held and a code is issued | The creator visits and shows the code |
| Posted | `submitted` | The creator added an https post link | The business marks it complete |
| Completed | `done` | Finished | Pinned to the creator's wall |
| Declined | `declined` | Turned down by either side | None |

A collab is **Last spot** with one spot left, **Full** when every spot is taken, and **Ended** after
its end date. These are worked out when read and never stored.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontFamily': 'Archivo, Helvetica, Arial, sans-serif', 'primaryColor': '#fffdf8', 'primaryTextColor': '#241a16', 'primaryBorderColor': '#c8102e', 'secondaryColor': '#fbe3e4', 'tertiaryColor': '#faf5ea', 'lineColor': '#8a7b70', 'clusterBkg': '#faf5ea', 'clusterBorder': '#e6dccb', 'edgeLabelBackground': '#faf5ea', 'titleColor': '#241a16', 'actorBkg': '#fffdf8', 'actorBorder': '#c8102e', 'actorTextColor': '#241a16', 'signalColor': '#8a7b70', 'signalTextColor': '#8a7b70', 'labelBoxBkgColor': '#fbe9bf', 'noteBkgColor': '#fbe9bf', 'noteBorderColor': '#f2b632', 'pie1': '#2f6b3f', 'pie2': '#f2b632', 'pie3': '#c8102e', 'pieStrokeColor': '#fffdf8', 'pieOuterStrokeColor': '#e6dccb'}}}%%
stateDiagram-v2
  direction LR
  [*] --> Open
  Open --> LastSpot : one spot left
  LastSpot --> Full : last spot accepted
  Open --> Ended : end date passes
  LastSpot --> Ended : end date passes
  Full --> Ended : end date passes
```

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 6. Business rules

> [!IMPORTANT]
> **Never more creators than spots,** even with a double tap or two phones at once. This is the
> one rule the whole design protects; see [Architecture §7](architecture.md#7-spot-guarantee).

- **One account per business.** Two phones on the same account are handled like two people.
- **Invites hold no spot.** More can go out than there are spots; the first to accept get them.
- **Ended means closed.** Accepting after the end date is refused. Decline still works.
- **Double taps are harmless.** Applying, accepting and inviting twice return the first result.
- **One request per creator per collab.** A declined creator can't apply to the same collab again.
- **A spot stays taken once given.** There's no releasing a no-show in this version.
- **The visit code** lets the business confirm the person at the counter was accepted. Staff
  compare it by eye.

| Field | Limit |
|---|---|
| Title | 80 characters |
| What's offered | 400 characters |
| What to post | 500 characters |
| About, who they're looking for, location | Optional: 1,000, 500 and 80 characters |
| Spots | 1 to 50 |
| Application line | 140 characters |
| Post link | https only, 500 characters |
| AI sentence | 300 characters |

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 7. AI features

| Feature | Who | What happens | If AI is unavailable |
|---|---|---|---|
| Fill the post form | Business | One sentence becomes a draft the business edits before publishing | The form is filled by hand |
| Creator summary | Business | A short summary written from the creator's facts, then saved | A plain line of facts |
| Picked for you | Creator | Code picks up to 3 open collabs that fit the creator's tags; the AI rewrites each reason once a day | The plain reason, such as "Fits your Coffee and Reels · 2 spots left · ends tomorrow" |

Skip is always visible, drafts time out after 8 seconds, and only fields that pass their checks are
kept. A draft is never published without the business reviewing it.
