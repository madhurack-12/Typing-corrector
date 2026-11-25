#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include "linked_list.h"
#include "queue.h"
#include "stack.h"

static void load_dataset(WordNode **dict,const char *filename){
  FILE *f=fopen(filename,"r"); if(!f)return; char line[256];
  if(fgets(line,sizeof line,f)){} /* CSV header */
  while(fgets(line,sizeof line,f)){char *comma=strchr(line,',');if(!comma)continue;*comma='\0';char *end=strpbrk(comma+1,"\r\n");if(end)*end='\0';*dict=list_add(*dict,line,comma+1);} fclose(f);
}
int main(void){
  WordNode *dictionary=NULL; load_dataset(&dictionary,"../data/typo_dataset.csv");
  if(!dictionary)load_dataset(&dictionary,"data/typo_dataset.csv");
  if(!dictionary){puts("Dataset not found. Run from the project root or c-engine folder.");return 1;}
  WordQueue words; queue_init(&words); TextStack undo; stack_init(&undo);
  char input[TEXT_SIZE],word[WORD_SIZE],output[TEXT_SIZE],previous[TEXT_SIZE];
  puts("TypeFix C demo (Linked List + Queue + Stack)");
  puts("Enter one paragraph (max 8191 characters):");
  if(!fgets(input,sizeof input,stdin)){list_free(dictionary);return 0;}
  input[strcspn(input,"\r\n")]='\0';
  if(!stack_push(&undo,input))puts("Undo stack is full.");
  char copy[TEXT_SIZE];snprintf(copy,sizeof copy,"%s",input);
  for(char *token=strtok(copy," \t");token;token=strtok(NULL," \t"))if(!enqueue(&words,token))break;
  output[0]='\0'; int changed=0;
  while(dequeue(&words,word)){
    char core[WORD_SIZE];snprintf(core,sizeof core,"%s",word);
    size_t n=strlen(core);size_t left=0,right=n;
    while(left<n&&!isalnum((unsigned char)core[left]))left++;
    while(right>left&&!isalnum((unsigned char)core[right-1]))right--;
    char punctuation_left[WORD_SIZE],punctuation_right[WORD_SIZE],bare[WORD_SIZE];
    snprintf(punctuation_left,sizeof punctuation_left,"%.*s",(int)left,core);
    snprintf(bare,sizeof bare,"%.*s",(int)(right-left),core+left);
    snprintf(punctuation_right,sizeof punctuation_right,"%s",core+right);
    const char *fix=list_correct(dictionary,bare); const char *chosen=fix?fix:bare;
    if(fix){changed++;if(isupper((unsigned char)bare[0])){static char cap[WORD_SIZE];snprintf(cap,sizeof cap,"%s",fix);cap[0]=(char)toupper((unsigned char)cap[0]);chosen=cap;}}
    char piece[WORD_SIZE*3];snprintf(piece,sizeof piece,"%s%s%s",punctuation_left,chosen,punctuation_right);
    if(output[0])strncat(output," ",sizeof output-strlen(output)-1);
    strncat(output,piece,sizeof output-strlen(output)-1);
  }
  printf("\nCorrected output:\n%s\n",output);
  printf("Dataset corrections applied: %d\n",changed);
  if(stack_pop(&undo,previous))printf("Undo snapshot saved: %s\n",previous);
  list_free(dictionary);return 0;
}
