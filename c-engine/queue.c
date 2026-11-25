#include <string.h>
#include "queue.h"
void queue_init(WordQueue *q){q->front=0;q->rear=-1;q->count=0;}
int enqueue(WordQueue *q,const char *word){if(q->count==QUEUE_SIZE)return 0;q->rear=(q->rear+1)%QUEUE_SIZE;strncpy(q->items[q->rear],word,WORD_SIZE-1);q->items[q->rear][WORD_SIZE-1]='\0';q->count++;return 1;}
int dequeue(WordQueue *q,char *out){if(!q->count)return 0;strcpy(out,q->items[q->front]);q->front=(q->front+1)%QUEUE_SIZE;q->count--;return 1;}
