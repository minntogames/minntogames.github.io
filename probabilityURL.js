        my_url1 ='https://minntogames.github.io/index.html';
	//通常リンクの文字を指定する
	my_name1='Minnteliaのお部屋';

	//ランダムリンクのURLを指定する
	my_url2 ='https://minntogames.github.io/128371631872375736812.html';
	//ランダムリンクの文字を指定する
	my_name2='MINNTERIAのお部屋';

	//リンクが表示する確率を指定する
	//大きいほど確率は低く、小さいほど高くなります
	ran=10;

	if(Math.floor(Math.random()*ran) < 2)
		document.write('<a href="'+my_url2+'">'+my_name2+'</a><br>');
	else 
		document.write('<a>'+my_name1+'</a><br>');
