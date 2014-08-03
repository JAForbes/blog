function loaded(files){

  var views = new MainView(files);


}

//accepts an array of items with a url and title property
function ListView(title, items){

  var $el = $('<div>');

  render()

  function template(){
    var listItems = _(items).map(function(item){

      return li( a({href:item.url},item.title))

    }).join('')

    return [
      h4(title),
      ul(listItems)
    ]
  }

  function render(){
    $el.html(template())
  }

  return {
    render: render,
    $el: function(){ return $el },
  }


}

function MainView(files){

  var $el = $('body');

  var listView = new ListView('Posts',listItems(files));
  render();

  function listItems(files){
    return _(files).map(function(file){
      return {
        title: file.name.replace('.md',''),
        url: file._links.git
      };
    })

  }

  function template(){
    return listView.$el;
  }

  function render(){
    $el.html(template())
  }
}