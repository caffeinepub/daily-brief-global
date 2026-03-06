import Int "mo:core/Int";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Migration "migration";

// Apply migration on upgrade
(with migration = Migration.run)
actor {
  include MixinStorage();

  let pendingVideos = Map.empty<Nat, Video>();
  let approvedVideos = Map.empty<Nat, Video>();
  let rejectedVideos = Map.empty<Nat, Video>();
  let comments = Map.empty<Nat, Comment>();

  var nextVideoId = 1;
  var nextCommentId = 1;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Video = {
    id : Nat;
    title : Text;
    url : Text;
    platform : { #youtube; #instagram; #other };
    thumbnail : Storage.ExternalBlob;
    viewCount : Nat;
    likeCount : Nat;
    submittedAt : Time.Time;
    status : VideoStatus;
  };
  type VideoStatus = { #pending; #approved; #rejected };

  type Comment = {
    id : Nat;
    videoId : Nat;
    text : Text;
    timestamp : Int;
  };

  module Video {
    public func compareByLikesTime(video1 : Video, video2 : Video) : Order.Order {
      switch (Nat.compare(video2.likeCount, video1.likeCount)) {
        case (#equal) { Int.compare(video2.submittedAt, video1.submittedAt) };
        case (order) { order };
      };
    };

    public func compareTimeDesc(video1 : Video, video2 : Video) : Order.Order {
      Int.compare(video2.submittedAt, video1.submittedAt);
    };
  };

  module Comment {
    public func compareTimeDesc(comment1 : Comment, comment2 : Comment) : Order.Order {
      Int.compare(comment2.timestamp, comment1.timestamp);
    };
  };

  public shared ({ caller }) func submitVideo(
    title : Text,
    url : Text,
    platform : { #youtube; #instagram; #other },
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
      status = #pending;
    };
    pendingVideos.add(nextVideoId, video);
    nextVideoId += 1;
    video;
  };

  public shared ({ caller }) func approveVideo(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can approve videos");
    };
    switch (pendingVideos.get(id)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) {
        let approvedVideo = { video with status = #approved };
        approvedVideos.add(id, approvedVideo);
        pendingVideos.remove(id);
      };
    };
  };

  public shared ({ caller }) func rejectVideo(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can reject videos");
    };
    switch (pendingVideos.get(id)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) {
        let rejectedVideo = { video with status = #rejected };
        rejectedVideos.add(id, rejectedVideo);
        pendingVideos.remove(id);
      };
    };
  };

  public query ({ caller }) func getVideos() : async [Video] {
    approvedVideos.values().toArray().sort(Video.compareTimeDesc);
  };

  public query ({ caller }) func getPendingVideos() : async [Video] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can view pending videos");
    };
    pendingVideos.values().toArray().sort(Video.compareTimeDesc);
  };

  public query ({ caller }) func getFeaturedVideo() : async ?Video {
    let videos = approvedVideos.values().toArray();
    if (videos.isEmpty()) {
      return null;
    };
    let sortedVideos = videos.sort(Video.compareByLikesTime);
    ?sortedVideos[0];
  };

  public shared ({ caller }) func likeVideo(videoId : Nat) : async ?Video {
    switch (approvedVideos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) {
        let updatedVideo = {
          video with
          likeCount = video.likeCount + 1;
        };
        approvedVideos.add(videoId, updatedVideo);
        ?updatedVideo;
      };
    };
  };

  public shared ({ caller }) func addComment(videoId : Nat, text : Text) : async ?Comment {
    switch (approvedVideos.get(videoId)) {
      case (null) { Runtime.trap("Video does not exist") };
      case (?_) {
        let comment : Comment = {
          id = nextCommentId;
          videoId;
          text;
          timestamp = Time.now();
        };
        comments.add(nextCommentId, comment);
        nextCommentId += 1;
        ?comment;
      };
    };
  };

  public query ({ caller }) func getComments(videoId : Nat) : async [Comment] {
    comments.values().filter(func(comment) { comment.videoId == videoId }).toArray().sort(Comment.compareTimeDesc);
  };

  public shared ({ caller }) func incrementViewCount(videoId : Nat) : async ?Video {
    switch (approvedVideos.get(videoId)) {
      case (null) { null };
      case (?video) {
        let updatedVideo = {
          video with
          viewCount = video.viewCount + 1;
        };
        approvedVideos.add(videoId, updatedVideo);
        ?updatedVideo;
      };
    };
  };

  public shared ({ caller }) func claimAdminWithToken(_userSecret : Text) : async () {
    // Check if caller is anonymous - reject anonymous callers
    if (caller.isAnonymous()) {
      return;
    };
    Runtime.trap("Not supported yet");
  };
};
