import { auth } from '../firebase';
import axios from 'axios';

// Post actions
export const FEED_POSTS_SET = 'FEED_POSTS_SET';
export const FEED_POSTS_ERROR = 'FEED_POSTS_ERROR';
export const USER_POSTS_SET = 'USER_POSTS_SET';
export const USER_POSTS_ADD = 'USER_POSTS_ADD';
export const USER_POSTS_ERROR = 'USER_POSTS_ERROR';
export const USER_POST_DELETED = 'USER_POST_DELETED';

// Session actions
export const AUTH_USER_SET = 'AUTH_USER_SET';
export const DB_USER_SET = 'DB_USER_SET';

// Users actions
export const USERS_SET = 'USERS_SET';

// Post creators
export const onSetFeedPosts = (feedPosts) => ({ type: FEED_POSTS_SET, feedPosts });
export const onErrorFeedPosts = (error) => ({ type: FEED_POSTS_ERROR, error });
export const onSetUserPosts = (userPosts) => ({ type: USER_POSTS_SET, userPosts });
export const onAddUserPost = (post) => ({ type: USER_POSTS_ADD, post });
export const onDeleteUserPost = (postId) => ({ type: USER_POST_DELETED, postId });
export const onErrorUserPosts = (error) => ({ type: USER_POSTS_ERROR, error });

// Session creators
export const onSetDBUser = (user) => ({ type: DB_USER_SET, dbUser: user });
export const onSetAuthUser = (authUser) => ({ type: AUTH_USER_SET, authUser });

// Post handlers
export const fetchFeedPosts = () => {
	return async (dispatch, getState) => {
		try {
			const token = await auth.currentUser.getIdToken()
			console.log(`Getting feed posts w/ user id: ${auth.currentUser.uid}`)
			console.log(
				`Feed GET settings:`, 
				getState().sessionState.dbUser.lat,
				getState().sessionState.dbUser.lng,
				getState().sessionState.dbUser.radius
			)
			const { data } = await axios.get(
				`/api/posts/geo`,
				{
				  headers: {token},
				  params: {
					lat: getState().sessionState.dbUser.lat,
					lng: getState().sessionState.dbUser.lng,
					radius: getState().sessionState.dbUser.radius
				  }
				}
			  )
			  
			console.log('Got feed posts:', data.responseData);
			dispatch(onSetFeedPosts(data.responseData));
			
		} catch (error) {
			console.error('Error:', error.response.data.error);
			dispatch(onErrorFeedPosts(error.response.data.error));
		}
		
	}
}

export const fetchUserPosts = () => {
	return async dispatch => {
		try {
			const token = await auth.currentUser.getIdToken()
			// Get DB user and input into Redux store
			console.log(`Getting user posts w/ user id: ${auth.currentUser.uid}`)
			const { data } = await axios.get(
				`/api/posts/user/${auth.currentUser.uid}`,
				{headers: {token}}
			)
			console.log('Got user posts:', data.responseData);
			dispatch(onSetUserPosts(data.responseData))
		} catch (error) {
			console.error('Error:', error.response.data.error);
			dispatch(onErrorUserPosts(error.response.data.error));
		}
	}
}

export const createPost = (post) => {
	return async dispatch => {
		try {
			const token = await auth.currentUser.getIdToken()
			// Get DB user and input into Redux store
			console.log(`Creating user posts w/ user id: ${auth.currentUser.uid}`)
			const { data: {responseData} } = await axios.post('/api/posts', post, {
				headers: {token}
			})

			console.log('Created user post:', responseData);
			
			dispatch(onAddUserPost(responseData))
		} catch (error) {
			console.error('Error:', error.response.data.error);
			dispatch(onErrorUserPosts(error.response.data.error));
		}
	}
}

export const deletePost = (id) => {
	return async dispatch => {
		try {
			const token = await auth.currentUser.getIdToken()
			// Get DB user and input into Redux store
			console.log(`User: ${auth.currentUser.uid} deleting post: ${id}`)
			const { data } = await axios.delete(`/api/posts/${id}`,{
				headers: {token}
			});

			console.log('Deleted user post:', data);
			// fetchUserPosts();
			dispatch(onDeleteUserPost(id));
		} catch (error) {
			console.error('Error:', error.response.data.error);
			dispatch(onErrorUserPosts(error.response.data.error));
		}
	}
}

// Session handlers
export const createUser = (user, token) => {
	return async dispatch => {
		try {
			const response = await axios.post(`/api/users/${user.uid}`, user, {headers: {token}})
			return response.data.responseData
		} catch (error) {
			console.error(error)
			return error
		}
	}
}


export const fetchDBUser = () => {
	return async dispatch => {
		if (!auth.currentUser)
			dispatch(onSetDBUser({}))
		else {
			try {
				// Get DB user and update Redux store
				const token = await auth.currentUser.getIdToken()
				const response = await axios.get(
					`/api/users/${auth.currentUser.uid}`,
					{headers: {token}}
				)
				console.log('Got DB User:', response.data.responseData);
				dispatch(onSetDBUser(response.data.responseData));
				return response.data.responseData
			} catch (error) {
				console.error(error)
				return error
			}
		}
	}
}

export const updateDBUser = (user) => {
	return async dispatch => {
		try {
			// Get DB user and update Redux store
			const token = await auth.currentUser.getIdToken()
			console.log('Updating user:', auth.currentUser.uid, 'to:', user)
			const response = await axios.put(
				`/api/users/${auth.currentUser.uid}`, 
				user,
				{headers: {token}}
			)
			dispatch(onSetDBUser(user))
			console.log(response.data.responseData)
			return response.data.responseData
		} catch (error) {
			console.error(error)
			return error
		}
	}
}

export const setAuthUser = authUser => dispatch => dispatch(onSetAuthUser(authUser));

export const deleteAccount = () => async dispatch => {
	try {
		const token = await auth.currentUser.getIdToken()
		const { data } = await axios.delete(`/api/users/${auth.currentUser.uid}`,{
			headers: {token}
		});
		const resp = await auth.signOut();
		dispatch(onSetAuthUser(null));
		console.log('Deleted user:', data.responseData);
	} catch (error) {
		console.error('Error:', error);
	}
}
	
