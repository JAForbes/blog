(function(){

  var gh = {
    api: 'https://api.github.com',
    repo: '/repos/JAForbes/jaforbes.github.io',
    posts: '/contents/posts',
    commits: '/commits?path=',
    token: '27baecda3aa5cfd03f32e7ac5fda77198c61e794',
    tokenHeader: 'x-oauth-basic',
  }

  var loaded_count = 0;
  var files_get_url = gh.api+gh.repo+gh.posts;

  $.ajax({
    url: files_get_url,
    username: gh.token,
    password: gh.tokenHeader,
    success: loadFiles
  })

  function loadFiles(files){
      _(files).map(function(file){
        var commitURL = gh.api+gh.repo+gh.commits+file.path;

        $.ajax({
          url: commitURL,
          username: gh.token,
          password: gh.tokenHeader,
          success: function(commits){
            loadDateFromCommits(file,commits);
            isFinished(loaded_count,files.length) && loaded(files)
          }
        })


      })

  }

  function loadDateFromCommits(file,commits){
      var commit = commits[0];
      file.created = commit.commit.author.date;
      loaded_count++;
  }

  function isFinished(loadedCount,fileCount){
    return loadedCount == fileCount;
  }


})()