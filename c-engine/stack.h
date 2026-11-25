#ifndef STACK_H
#define STACK_H
#define STACK_SIZE 32
#define TEXT_SIZE 8192
typedef struct { char items[STACK_SIZE][TEXT_SIZE]; int top; } TextStack;
void stack_init(TextStack *s);
int stack_push(TextStack *s,const char *text);
int stack_pop(TextStack *s,char *out);
#endif
