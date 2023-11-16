main -> cond



cond -> term "==" term {% ([left, _, right]) => left === right %}
     | term "!=" term {% ([left, _, right]) => left !== right %}
     | term ">" term  {% ([left, _, right]) => left > right %}
     | term "<" term  {% ([left, _, right]) => left < right %}
     | term ">=" term {% ([left, _, right]) => left >= right %}
     | term "<=" term {% ([left, _, right]) => left <= right %}

term -> number|string|boolean
string -> [a-z ]:+ {% d => d %}
number -> [0-9]:+ {% d => parseInt(d[0].join("")) %}
boolean -> "true" {% () => true %}
        | "false" {% () => false %}
