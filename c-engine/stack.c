#include <string.h>
#include "stack.h"
void stack_init(TextStack *s){s->top=-1;}
int stack_push(TextStack *s,const char *text){if(s->top>=STACK_SIZE-1)return 0;strncpy(s->items[++s->top],text,TEXT_SIZE-1);s->items[s->top][TEXT_SIZE-1]='\0';return 1;}
int stack_pop(TextStack *s,char *out){if(s->top<0)return 0;strcpy(out,s->items[s->top--]);return 1;}
