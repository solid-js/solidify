# Utils 

## Array Utils

- `inArray`   
Check it an element is in an array.
Will only search at first level.

- `deleteWhere`   
Delete elements from an array following a condition.
Will return a new Array reference to re-affect.

- `removeElement`   
Remove an element from an array. Will return a new Array reference to re-affect.

- `shuffle`   
Shuffle an indexed array.

- `countFrom`   
Will count from a number to another by adding one at each loop. Makes a 'for' loop with a function call. (Usefull with JSX)

- `countTo`  
Will count from 0 to a number. Makes a 'for' loop with a function call. (Usefull with JSX)

- `countWidth`   
Makes a 'for' loop with a function call.
(Usefull with JSX)


## String Utils

- `zeroFormat`  
Prepend a number by a fixed number of zeros.
Useful to target sprites or some renamed files.  

- `trailingSlash`  
Add or remove the trailing slash at the end of a path.  

- `leadingSlash`  
Add or remove the leading slash at the start of a path.

- `upperCaseFirstChar`  
First letter capital on given string.

- `lowerCaseFirstChar`  
Convert a dash case formated string to a camel case format.

- `camelToDashCase`  
Convert camelCase to dash_case or dash-case or DASH_CASE and event DASH-CASE

- `enumToString`  
Convert typescript enum to string, camelCase or dash-case. 

- `stringToEnum`  
Find an index typescript enum from string.

- `getFileFromPath`  
Get file name from any path. Will return full string if no slash found.

- `getBaseFromPath`  
Get the base folder from any path. Will include trailing slash. 
Will return full string if no slash found.

- `extractPathFromBase`        
Get the local path from a full path and a base.

- `quickMustache`    
Micro template engine using regex and mustache like notation

- `slugify`  
Converting a string for URL's

- `parseQueryString`  
Will parse a query string like this:
test=myValue&varName=otherValue to {test: 'myValue', varName: 'otherValue'}

- `nl2br`  
Good old nl2br from PHP...

