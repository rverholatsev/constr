<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>3D-Конструктор цветочных букетов</title>
        <script src="constructor.js"></script>
        <style>
            body{
                background: #ccccff;
            }
            #box{
                position: relative;
                margin: auto;
                width: 800px;
                height: 500px;
            }
            #bug{
                position: fixed;
                bottom: 0;
                font: normal 10px Century Gothic;
                text-align: center;
            }
        </style>
        <script>
            window.addEventListener('load', function(e) {
                var constr = new Constructor(box);

                setInterval(function(){
                    bug.innerTEXT = JSON.stringify(constr.getConfig());
                }, 2000);
            });
        </script>
    </head>
    <body>
        <span id="bug"></span>
        <div id="box"></div>
    </body>
</html>