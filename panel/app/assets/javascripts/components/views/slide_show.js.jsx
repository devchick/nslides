var SlideShow = React.createClass({
    getInitialState() {
        return {
            started_at: (new Date).getTime(),
            current_page_num: this.props.current_page_num,
            elapsed_time: 0,
            acts_as: "viewer",

            slide: this.props.slide,
            pages: this.props.pages,
            comments: []
        };
    },

    componentDidMount() {
        this.subscriptChannel();
        this.fetchComments();
        this.interval = setInterval(this.updateElapsedTime, 200);
    },

    componentWillUnmount() {
        clearInterval(this.interval);
    },

    render: function() {
        var current_page = this.getCurrentPage();

        return (
            <div className="slide_show">
              <TopMenu />
              <SlideBox
                 slide={this.state.slide}
                 current_page={current_page}
                 comments={this.state.comments}
                 acts_as={this.state.acts_as}
                 setActsAs={this.setActsAs}
                 getElapsedTime={this.getElapsedTime} />
              <ActionBox current_page={current_page} getElapsedTime={this.getElapsedTime} />
            </div>
        );
    },

    // ActionCableチャネルの購読
    subscriptChannel() {
        App.slide = App.cable.subscriptions.create(
            { channel: "SlideChannel", slide_id: this.state.slide.id },
            {
                // ActionCableが接続されたときのコールバック
                connected() {
                },

                // ActionCableが切断されたときのコールバック
                disconnected() {
                },

                // ActionCableが受信したときのコールバック
                received(data, locally=false) {
                    if (!locally && this.state.acts_as == "viewer") {
                        // サーバーからの通知かつ閲覧者モードの場合はページ遷移イベントを無視
                        delete data.current_page_num;
                        delete data.started_at;
                    }

                    var next_state = this.mergeData(data);
                    var callback;
                    if (next_state.current_page_num && next_state.current_page_num != this.state.current_page_num) {
                        // ページが変更されていたらコメントを取得
                        callback = this.fetchComments;
                    }
                    this.setState(next_state, callback);
                },

                addComment(comment) {
                    this.perform('add_comment', { comment: comment });
                },

                prevPage(current_page) {
                    switch(this.getActsAs()) {
                    case "presenter":
                        // 発表者はページ遷移イベントをCable越しにサーバーへ通知
                        this.perform('goto_prev_page', { page_id: current_page.id });
                        break;
                    case "audience":
                    case "viewer":
                    default:
                        // 発表者以外はページ遷移イベントはクライアント内で処理する
                        var page = this.getPage({page_num: current_page.num - 1});
                        if (page) {
                            this.received({ current_page_num: page.num, started_at: (new Date).getTime() }, true);
                        }
                    }
                },

                nextPage(current_page) {
                    switch(this.getActsAs()) {
                    case "presenter":
                        // 発表者はページ遷移イベントをCable越しにサーバーへ通知
                        this.perform('goto_next_page', { page_id: current_page.id });
                        break;
                    case "audience":
                    case "viewer":
                    default:
                        // 発表者以外はページ遷移イベントはクライアント内で処理する
                        var page = this.getPage({page_num: current_page.num + 1});
                        console.log("nextPage not as presenter", page);
                        if (page) {
                            this.received({ current_page_num: page.num, started_at: (new Date).getTime() }, true);
                        }
                    }
                },

                getActsAs: this.getActsAs,
                getPage: this.getPage,

                none: undefined
            }
        );
        App.slide.received  = App.slide.received.bind(this);
    },

    fetchComments() {
        $.ajax({
            url: "/slides/" + this.props.slide.id + "/comments.json",
            data: { page_num: this.state.current_page_num },
            dataType: "json"
        }).done(
            (data) => { this.setState(this.mergeData(data)); }
        ).fail(
            (data) => { console.log("Failed to fetch comments", data); }
        );
    },

    mergeData(data) {
        var ret = {};

        if (data.comment) {
            ret.comments = this.mergeComments([data.comment]);
        }
        if (data.comments) {
            ret.comments = this.mergeComments(data.comments);
        }
        if (data.current_page_num) {
            ret.current_page_num = data.current_page_num;
        }
        if (data.started_at) {
            ret.started_at = data.started_at;
        }
        return ret;
    },

    mergeComments(comments_data) {
        // 重複チェック用に現在のコメントIDを取得
        var ids = this.state.comments.map((comment) => comment.id);

        return comments_data.reduce(
            (ret, comment) => {
                if (ids.indexOf(comment.id) >= 0) {
                    // 重複するコメントデータは追加しない
                    return ret;
                } else {
                    // 重複してないコメントデータを追加
                    return ret.concat(comment);
                }
            },
            this.state.comments || []).sort((a, b) => (b.recorded_time - a.recorded_time));
    },

    getPage(options) {
        if (options.page_num) {
            return this.state.pages.find((page) => (page.num == options.page_num));
        } else if (options.page_id) {
            return this.state.pages.find((page) => (page.num == options.page_id));
        } else {
            return undefined;
        }
    },

    getCurrentPage() {
        return this.getPage({page_num: this.state.current_page_num});
    },

    getElapsedTime() {
        return (new Date).getTime() - this.state.started_at;
    },

    updateElapsedTime() {
        this.setState({elapsed_time: this.getElapsedTime()});
    },

    getActsAs() {
        return this.state.acts_as;
    },

    setActsAs(acts_as) {
        switch(acts_as) {
        case "presenter":
        case "audience":
        case "viewer":
            this.setState({ acts_as });
            break;
        default:
            console.log("Unkown arg for setActsAs(): #{acts_as}");
        }
    },

    none: undefined

});
