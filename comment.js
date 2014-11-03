post = $('.post').text()

function wordList(text){
  punctuation = /(\.|"|'|,|:|;|!|\(|\)|\?)/g
  words = text
    .toLowerCase()
    .replace(punctuation,'')
    .split(/\s/)
  //remove filler words
  words = _(words).filter(function(word){
    return word.length > 4;
  })
  return words
}

comment = "Check out my blog.  I love your work."

function relevance(comment,post){

  var commentWords = wordList(comment)
  var postWords = wordList(post)

  var nWordsInCommon = _(commentWords).intersection(postWords).length;

  return nWordsInCommon/commentWords.length
}

relevance(comment,post)