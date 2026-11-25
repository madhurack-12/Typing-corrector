# TypeFix Pro

A typing-correction website with a clean editor interface and a C demonstration built around exactly three data structures: **Linked List, Queue and Stack**.

## Run the website

Requirements: Node.js 18 or newer and an internet connection for the full LanguageTool correction service.

```bash
npm start
```

Open http://localhost:3000. The dashboard accepts up to 50,000 characters and checks complete sentences and paragraphs.

## Correction engine and dataset

- The server sends the complete text to the LanguageTool public API first. It can identify many spelling, grammar and punctuation issues in context.
- If the online service is unavailable, TypeFix uses `data/typo_dataset.json` plus a small hand-written fallback list.
- `data/typo_dataset.csv` and `.json` contain **5,000 synthetic typo → correct-word pairs**. These are generated character-edit examples based on a limited common-word vocabulary. They are useful as a starter lookup/augmentation dataset, **not a trained machine-learning model and not a guarantee of correcting every possible typo**.
- The C demo loads the CSV dictionary into a linked list, queues words for processing, and uses a stack to retain the original paragraph.

## Compile and run the C demo

From the project folder:

```bash
cd c-engine
gcc -std=c11 -Wall -Wextra -O2 main.c linked_list.c queue.c stack.c -o typefix
./typefix
```

The demo expects `../data/typo_dataset.csv` when run from `c-engine`. On Windows, run `typefix.exe` after compiling with MinGW GCC.

## Data structures

1. **Linked List** — stores typo/correction pairs and supports lookup.
2. **Queue** — processes input words in FIFO order.
3. **Stack** — stores the original text snapshot for LIFO undo.

No additional C data structures are used in the demonstration.

## Project layout

```text
TypeFix_Pro/
  public/              Website and dashboard
  c-engine/            C linked-list, queue and stack implementation
  data/                5,000 typo/correction pairs (CSV + JSON)
  server.js            Node.js API and static server
  package.json
```

## Important notes

- The online LanguageTool service is required for broad context-aware paragraph correction. Network access, service limits and supported languages may affect results.
- The local dataset is a finite lookup fallback; unseen, context-dependent or ambiguous mistakes may remain uncorrected. Always review automatic suggestions, especially names, technical terms and meaning-sensitive text.
- The included pairs are synthetic augmentation data, not verified human-labelled training examples. For a real ML model, collect licensed, quality-reviewed sentence pairs and evaluate on a separate test set.
