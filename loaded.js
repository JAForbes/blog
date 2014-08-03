function loaded(files){

  console.log(files)

  var listItems = _(files).map(function(file){
    return {
      title: file.name.replace('.md',''),
      url: file._links.git
    };
  })

  console.log(listItems)

}

//accepts an array of items with a url and title property
function ListView(items){

  var $el = $('<ul>');

  render()

  function template(){
    var listItems = _(items).map(function(item){

      return li( a({href:item.url},item.title))

    }).join('')

    return listItems
  }

  function render(){
    $el.html(template())
  }

  return {
    render: render,
    $el: function(){ return $el }
  }


}

items = [{url:'http://www.google.com', title: 'Example Post'},{url:'http://www.google.com', title: 'Example Post'}]

var list = new ListView(items)
list.$el().html()