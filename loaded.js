function loaded(files){

  addIds(files)

  var views = new MainView(_(files).reverse());

}


function addIds(files){
  _(files).each(function(file){
    file.id = _.uniqueId()
  });
}



//accepts an array of items with title id property
function ListView(endpoint, items){

  var $el = $('<ul>').addClass(endpoint);

  render()


  function template(){
    var listItems = _(items).map(function(item){

      return li(
        a({href:'#/'+endpoint+'/'+item.id},
          item.title,div({class:'tiny'},'('+item.created+')')
        )
      )

    }).join('')

    return listItems;
  }

  function render(){
    $el.html(template())
  }

  return {
    render: render,
    $el: function(){ return $el },
  }


}

function BioView(src){

  var $el = $('<div>').addClass('bio');

  $el.append([
    img({src:src}),
    p("Hi!  I'm James!  I am a programmer and a musician.")
  ]);

  return {
    $el: function(){
      return $el;
    }
  }

}

function PostView(file){

  var $el = $('<div>').addClass('post');


  function loadBody(callback){
    if(!file.body){
      $.ajax({
        url: file._links.git,
        beforeSend: function(request){
          request.setRequestHeader("Accept", "application/vnd.github.VERSION.raw");
        },
        success:function(blob){

           file.body = marked.parse(blob)
           render()
           callback()

        }
      })
    } else {
      render();
    }
  }

  function template(){
    var mo = moment(file.created);
    var pretty = b('Posted')+': '+mo.fromNow()

    return file.body + p({class:'datestamp'},pretty)
  }

  function update(_file,callback){
    file = _file;
    loadBody(callback)
  }

  function render(){
    $el.html(template());
  }

  return {
    update:update,
    $el: function(){ return $el }
  }

}

function MainView(files){

  var $el = $('body');

  var bioView = new BioView('https://pbs.twimg.com/profile_images/378800000542057580/361d3e72fd5f7d7f2a2b60885e6fd157.jpeg');
  var listView = new ListView('posts',listItems(files));
  var postView = new PostView();

  render();
  loadPage()
  window.onhashchange = loadPage

  function listen(){
    $el.find('.posts a').click(function(e){
      var href = $(this).attr('href');
      var id = href.replace('#/posts/','')
    });
  }

  function loadPage(){
    var href = window.location.hash;
    var id = href.replace('#/posts/','')


    loadPost(id);
  }

  function loadPost(id){
    var file = _(files).where({id:id})[0];
    if(!file){
      file = files[0]
    }
    postView.update(file,render);
  }

  function listItems(files){
    return _(files).map(function(file){
      return {
        title: file.name.replace('.md',''),
        id: file.id,
        created: moment(file.created).fromNow()
      };
    })

  }

  function template(){
    var $sidebar = $('<div class="sidebar">').append([
      bioView.$el(),
      listView.$el()

    ]);

    return [
      $sidebar,
      postView.$el()
    ];
  }

  function render(){
    $el.html(template())
    listen()
  }
}