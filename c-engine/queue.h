#ifndef QUEUE_H
#define QUEUE_H
#define WORD_SIZE 128
#define QUEUE_SIZE 4096
typedef struct { char items[QUEUE_SIZE][WORD_SIZE]; int front,rear,count; } WordQueue;
void queue_init(WordQueue *q);
int enqueue(WordQueue *q,const char *word);
int dequeue(WordQueue *q,char *out);
#endif
