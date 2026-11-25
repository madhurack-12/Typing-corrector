#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <stdio.h>
#include "linked_list.h"
static int same_word(const char *a,const char *b){while(*a&&*b){if(tolower((unsigned char)*a)!=tolower((unsigned char)*b))return 0;a++;b++;}return *a==*b;}
WordNode *list_add(WordNode *head,const char *wrong,const char *correct){WordNode *n=malloc(sizeof *n);if(!n)return head;snprintf(n->wrong,sizeof n->wrong,"%s",wrong);snprintf(n->correct,sizeof n->correct,"%s",correct);n->next=head;return n;}
const char *list_correct(WordNode *head,const char *word){for(;head;head=head->next)if(same_word(head->wrong,word))return head->correct;return NULL;}
void list_free(WordNode *head){while(head){WordNode *next=head->next;free(head);head=next;}}
