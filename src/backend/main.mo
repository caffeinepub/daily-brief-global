import Array "mo:core/Array";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Time "mo:core/Time";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Runtime "mo:core/Runtime";

actor {
  include MixinStorage();

  type Video = {
    id : Nat;
    title : Text;
    url : Text;
    platform : Text; // "youtube" or "instagram"
    thumbnail : Storage.ExternalBlob;
    viewCount : Nat;
    likeCount : Nat;
    submittedAt : Int;
  };

  module Video {
    public func compareByLikesTime(video1 : Video, video2 : Video) : Order.Order {
      switch (Nat.compare(video1.likeCount, video2.likeCount)) {
        case (#equal) {
          Int.compare(video1.submittedAt, video2.submittedAt);
        };
        case (order) { order };
      };
    };

    public func compareTimeDesc(video1 : Video, video2 : Video) : Order.Order {
      Int.compare(video2.submittedAt, video1.submittedAt);
    };
  };

  type Comment = {
    id : Nat;
    videoId : Nat;
    text : Text;
    timestamp : Int;
  };

  module Comment {
    public func compareTimeDesc(comment1 : Comment, comment2 : Comment) : Order.Order {
      Int.compare(comment2.timestamp, comment1.timestamp);
    };
  };

  // Store videos and comments in maps
  let videoStore = Map.empty<Nat, Video>();
  let commentStore = Map.empty<Nat, Comment>();

  var nextVideoId = 1;
  var nextCommentId = 1;

  public shared ({ caller }) func submitVideo(
    title : Text,
    url : Text,
    platform : Text,
    thumbnail : Storage.ExternalBlob,
    viewCount : Nat,
  ) : async Video {
    let video : Video = {
      id = nextVideoId;
      title;
      url;
      platform;
      thumbnail;
      viewCount;
      likeCount = 0;
      submittedAt = Time.now();
    };
    videoStore.add(nextVideoId, video);
    nextVideoId += 1;
    video;
  };

  public query ({ caller }) func getVideos() : async [Video] {
    let videos = videoStore.values().toArray();
    videos.sort(
      Video.compareTimeDesc
    );
  };

  public query ({ caller }) func getFeaturedVideo() : async ?Video {
    let videos = videoStore.values().toArray();
    if (videos.isEmpty()) {
      return null;
    };
    let sortedVideos = videos.sort(Video.compareByLikesTime);
    ?sortedVideos[0];
  };

  public shared ({ caller }) func likeVideo(videoId : Nat) : async ?Video {
    switch (videoStore.get(videoId)) {
      case (null) { null };
      case (?video) {
        let updatedVideo = {
          video with
          likeCount = video.likeCount + 1;
        };
        videoStore.add(videoId, updatedVideo);
        ?updatedVideo;
      };
    };
  };

  public shared ({ caller }) func addComment(videoId : Nat, text : Text) : async ?Comment {
    switch (videoStore.get(videoId)) {
      case (null) { Runtime.trap("Video does not exist") };
      case (?_) {
        let comment : Comment = {
          id = nextCommentId;
          videoId;
          text;
          timestamp = Time.now();
        };
        commentStore.add(nextCommentId, comment);
        nextCommentId += 1;
        ?comment;
      };
    };
  };

  public query ({ caller }) func getComments(videoId : Nat) : async [Comment] {
    let commentsIter = commentStore.values().filter(
      func(comment) { comment.videoId == videoId }
    );
    let comments = commentsIter.toArray();
    comments.sort(
      Comment.compareTimeDesc
    );
  };

  public shared ({ caller }) func incrementViewCount(videoId : Nat) : async ?Video {
    switch (videoStore.get(videoId)) {
      case (null) { null };
      case (?video) {
        let updatedVideo = {
          video with
          viewCount = video.viewCount + 1;
        };
        videoStore.add(videoId, updatedVideo);
        ?updatedVideo;
      };
    };
  };
};
