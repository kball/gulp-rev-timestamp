var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var Buffer = require('buffer').Buffer;
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var map = require('event-stream').map;

var FILE_DECL = /(?:href=|src=|url\()['|"]([^\s>"']+?)\?rev=([^\s>"']+?)['|"]/gi;

var revTimeStamp = function(options){

  return map(function(file,cb){
    var contents, lines, i, length, line, groups, dependencyPath, data, hash;

    options = options || {};//options bulled from parameter sent to revPlugin
    if(!options.hasOwnProperty("strict"))
        options.strict=false;
    if(!options.hasOwnProperty("mode"))
        options.mode="timestamp";
    if(!options.hasOwnProperty("revision"))
        options.revision=0;
    console.log(options.mode);
    if(!file)
        throw new PluginError('gulp-rev-append', 'Missing file option for gulp-rev-append.');
    if(!file.contents)
        throw new PluginError('gulp-rev-append', 'Missing file.contents required for modifying files using gulp-rev-append.');

    contents = file.contents.toString();
    lines = contents.split('\n');
    length = lines.length;

    for(i = 0; i < length; i++)
    {
      line = lines[i];
      groups = FILE_DECL.exec(line);
      if(groups && groups.length > 1)
      {
          if(options.strict)
          {
              var normPath = path.normalize(groups[1]);
              if (normPath.indexOf(path.sep) === 0)
                  dependencyPath = path.join(file.base, normPath);
              else
                  dependencyPath = path.resolve(path.dirname(file.path), normPath);
              try
              {
                  data = fs.readFileSync(dependencyPath);
                  hash = crypto.createHash('md5');
                  hash.update(data.toString(), 'utf8');
                  line = line.replace(groups[2], hash.digest('hex'));
              }catch(e){
                  console.log("loop "+i+" failed on strict:true",e);
              }
          }
          else if(options.mode=="timestamp")
          {
              try {
                  var current_date = (new Date()).valueOf().toString();
                  var random = Math.random().toString();
                  line = line.replace(groups[2], crypto.createHash('md5').update(current_date + random).digest('hex'));
              }catch(e){
                  console.log("loop "+i+" failed on mode:timestamp",e);
              }
          }
          else if(options.mode=="revision")
          {
              try {
                  line = line.replace(groups[2], options.revision);
              }catch(e){
                  console.log("loop "+i+" failed on revision:"+options.revision,e);
              }
          }
          else
          {
              console.log("Invalid Mode");
          }
      }
      lines[i] = line;
      FILE_DECL.lastIndex = 0;
    }//for

    file.contents = new Buffer(lines.join('\n'));
    cb(null, file);

  });//map

};//revPlugin

module.exports = revTimeStamp;
