#ifndef LINKED_LIST_H
#define LINKED_LIST_H
typedef struct WordNode { char wrong[64]; char correct[64]; struct WordNode *next; } WordNode;
WordNode *list_add(WordNode *head, const char *wrong, const char *correct);
const char *list_correct(WordNode *head, const char *word);
void list_free(WordNode *head);
#endif
