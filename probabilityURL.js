        my_url1 ='https://minntogames.github.io/index.html';
	//通常リンクの文字を指定する
	my_name1='Minnteliaのお部屋';

	//ランダムリンクのURLを指定する
	my_url2 ='https://666-minntogames-site.glitch.me/6666jaksdjakshdahdhsakjhdhadbcmnzc.html';
	//ランダムリンクの文字を指定する
	my_name2='MINNTERIAのお部屋';

	//リンクが表示する確率を指定する
	//大きいほど確率は低く、小さいほど高くなります
	ran=65535;

	if(Math.floor(Math.random()*ran) < 2)
		document.write('<a href="'+my_url2+'">'+my_name2+'</a><br>');
	else 
		document.write('<a>'+my_name1+'</a><br>');
